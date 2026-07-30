import pytest

from tests.conftest import login


@pytest.mark.asyncio
async def test_get_own_client_returns_200(client, two_agencies):
    token = await login(client, "admin-a@test.com")
    r = await client.get(
        f"/api/v1/clients/{two_agencies['client_a'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["id"] == str(two_agencies["client_a"].id)


@pytest.mark.asyncio
async def test_get_other_agency_client_returns_404(client, two_agencies):
    token = await login(client, "admin-a@test.com")
    r = await client.get(
        f"/api/v1/clients/{two_agencies['client_b'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_list_clients_excludes_other_agency(client, two_agencies):
    token = await login(client, "admin-a@test.com")
    r = await client.get("/api/v1/clients/", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()["clients"]]
    assert str(two_agencies["client_a"].id) in ids
    assert str(two_agencies["client_b"].id) not in ids


@pytest.mark.asyncio
async def test_delete_other_agency_client_returns_404_not_403(client, two_agencies):
    token = await login(client, "admin-a@test.com")
    r = await client.delete(
        f"/api/v1/clients/{two_agencies['client_b'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_cross_agency_content_returns_404(client, two_agencies, db_session):
    from services import crud

    content = await crud.create_content(
        db_session, client_id=two_agencies["client_b"].id, title="B's content", content_type="blog_post",
    )
    await db_session.commit()

    token = await login(client, "admin-a@test.com")
    r = await client.get(
        f"/api/v1/content/{two_agencies['client_b'].id}/content/{content.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 404
