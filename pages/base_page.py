from playwright.sync_api import Page

class BasePage:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self, url: str):
        self.page.goto(url)

    def click_element(self, selector: str):
        self.page.locator(selector).click()

    def fill_input(self, selector: str, value: str):
        self.page.fill(selector, value)

    def is_element_visible(self, selector: str) -> bool:
        return self.page.locator(selector).is_visible()