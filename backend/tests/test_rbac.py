import pytest

from tests.conftest import login


@pytest.mark.asyncio
async def test_agency_member_cannot_delete_client_403(client, two_agencies):
    token = await login(client, "member-a@test.com")
    r = await client.delete(
        f"/api/v1/clients/{two_agencies['client_a'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_agency_admin_can_delete_client_204(client, two_agencies):
    token = await login(client, "admin-a@test.com")
    r = await client.delete(
        f"/api/v1/clients/{two_agencies['client_a'].id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 204


@pytest.mark.asyncio
async def test_agency_member_cannot_launch_campaign_403(client, two_agencies, db_session):
    from services import crud
    from datetime import datetime, timezone

    campaign = await crud.create_campaign(
        db_session, client_id=two_agencies["client_a"].id, name="Test Campaign",
        campaign_type="seo", start_date=datetime.now(timezone.utc), end_date=datetime.now(timezone.utc),
        budget=100.0,
    )
    await db_session.commit()

    token = await login(client, "member-a@test.com")
    r = await client.post(
        f"/api/v1/campaigns/{campaign.id}/launch",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403
