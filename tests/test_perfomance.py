import time
import pytest
from pages.home_page import HomePage

@pytest.mark.performance
def test_page_load_time(page):
    home_page = HomePage(page)
    start_time = time.time()
    home_page.navigate("https://zvenfit.ru/")
    end_time = time.time()
    assert end_time - start_time < 3, "Страница загружается медленно!"