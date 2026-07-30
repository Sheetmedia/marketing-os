import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db
from services import crud

TEST_DATABASE_URL = "sqlite+aiosqlite://"


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def two_agencies(db_session):
    """Creates Agency A (admin_a + member_a + client_a) and Agency B (admin_b + client_b)."""
    agency_a = await crud.create_agency(db_session, name="Agency A", slug="agency-a")
    agency_b = await crud.create_agency(db_session, name="Agency B", slug="agency-b")

    admin_a = await crud.create_user(
        db_session, email="admin-a@test.com", password="pass1234",
        full_name="Admin A", role="agency_admin", agency_id=agency_a.id,
    )
    member_a = await crud.create_user(
        db_session, email="member-a@test.com", password="pass1234",
        full_name="Member A", role="agency_member", agency_id=agency_a.id,
    )
    admin_b = await crud.create_user(
        db_session, email="admin-b@test.com", password="pass1234",
        full_name="Admin B", role="agency_admin", agency_id=agency_b.id,
    )

    client_a = await crud.create_client(db_session, agency_id=agency_a.id, name="Client A", domain="a.com")
    client_b = await crud.create_client(db_session, agency_id=agency_b.id, name="Client B", domain="b.com")

    await db_session.commit()
    return {
        "agency_a": agency_a, "agency_b": agency_b,
        "admin_a": admin_a, "member_a": member_a, "admin_b": admin_b,
        "client_a": client_a, "client_b": client_b,
    }


async def login(client, email, password="pass1234"):
    r = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]
