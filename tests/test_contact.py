import requests_mock
import time
import pytest
from pages.contact_page import ContactPage

@pytest.fixture
def mock_api():
    with requests_mock.Mocker() as m:
        m.post("https://zvenfit.ru/", json={"success": True})
        yield m


@pytest.fixture
def setup(page, mock_api):
    contact_page = ContactPage(page)
    contact_page.navigate("https://zvenfit.ru/")
    return contact_page

def test_contact_form_submission(setup):
    setup.fill_contact_form("Тест", "1111111111")
    time.sleep(3)
    assert setup.is_success_message_displayed(), "Форма не отправлена!"