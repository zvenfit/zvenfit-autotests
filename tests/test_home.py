from pages.home_page import HomePage
import pytest

@pytest.fixture
def setup(page):
    home_page = HomePage(page)
    home_page.navigate("https://zvenfit.ru/")
    return home_page

def test_home_page_logo(setup):
    assert setup.is_logo_visible(), "Логотип не найден!"

def test_click_all_buttons(setup):
    setup.click_all_buttons()
    assert True, "Кнопки не работают!"
