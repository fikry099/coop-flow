import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from main import app  # Sesuaikan jika nama file utama berbeda


# Fixture ini murni mengelola lifespan (startup/shutdown) tanpa TestClient
@pytest.fixture
async def client():
    async with LifespanManager(app) as manager:
        transport = ASGITransport(app=manager.app)
        async with AsyncClient(
            transport=transport, base_url="http://testserver"
        ) as ac:
            yield ac


# -------------------------------------------------------------
# TEST 1: Check Status
# -------------------------------------------------------------
@pytest.mark.anyio
async def test_check_status_via_browser(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "engine": "COOP-FLOW ML Engine"}


# -------------------------------------------------------------
# TEST 2: Model 1 (Predict Fertilizer)
# -------------------------------------------------------------
@pytest.mark.anyio
async def test_predict_fertilizer_need_success(client):
    payload = {
        "luas_lahan_hektar": 2.5,
        "jenis_komoditas": "Padi",
        "fase_tanam_saat_ini": "Vegetatif",
        "jenis_pupuk_input": "Urea",
        "jumlah_pupuk_fase_sebelumnya_kg": 50.0,
        "fase_tanam_sebelumnya": "Olahraga Lahan",
        "curah_hujan_mm": 120.5,
        "suhu_rata_rata_celcius": 28.0,
        "kelembapan_persen": 80.0,
    }

    response = await client.post("/predict/fertilizer", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "recommended_dosage_kg" in data
    assert isinstance(data["recommended_dosage_kg"], (int, float))


# -------------------------------------------------------------
# TEST 3: Model 2 (Forecast Stock)
# -------------------------------------------------------------
@pytest.mark.anyio
async def test_predict_procurement_stock_success(client):
    payload = {
        "jenis_pupuk": "NPK",
        "bulan": 8,
        "hari_libur_nasional": 2,
        "stok_tersedia_saat_ini_kg": 150.0,
        "total_prediksi_kebutuhan_petani_sebulan_ke_depan_kg": 500.0,
        "provinsi_koperasi": "JAWA TENGAH",
        "asumsi_lead_time_hari": 3,
    }

    response = await client.post("/forecast/stock", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "suggested_procurement_kg" in data
    assert isinstance(data["suggested_procurement_kg"], (int, float))
    assert data["suggested_procurement_kg"] >= 0


# -------------------------------------------------------------
# TEST 4: Validation Error 422
# -------------------------------------------------------------
@pytest.mark.anyio
async def test_predict_fertilizer_validation_error(client):
    payload = {}

    response = await client.post("/predict/fertilizer", json=payload)

    assert response.status_code == 422