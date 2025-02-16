import requests_mock
import time
import pytest
from pages.contact_page import ContactPage


@pytest.fixture
def setup(page):

    def handle_route(route, request):
        if request.method == "POST":
            route.fulfill(
                status=200,
                content_type="application/json",
                body='{"success": true, "message": "Форма успешно отправлена!"}'
            )
        else:
            route.continue_()

    page.route("https://zvenfit.ru/api/v2/form/submit", handle_route)

    contact_page = ContactPage(page)
    contact_page.navigate("https://zvenfit.ru/")
    yield contact_page


def test_contact_form_submission(setup):
    setup.fill_contact_form("Тест", "1111111111")
    time.sleep(3)
    assert setup.is_success_message_displayed(), "Форма не отправлена!"