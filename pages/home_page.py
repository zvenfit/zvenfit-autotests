from pages.base_page import BasePage

class HomePage(BasePage):
    def __init__(self, page):
        super().__init__(page)
        self.logo = "#header > div.sb-container > div > a.sb-logotype-wrapper.sb-logotype-wrapper_adaptive_size-xl > img"
        self.buttons = ["#header > div.sb-container > div > div.s-header-type-1__menu-wrapper.js-menu > nav > ul > li:nth-child(1) > a", "#header > div.sb-container > div > div.s-header-type-1__menu-wrapper.js-menu > nav > ul > li:nth-child(2) > a", "#header > div.sb-container > div > div.s-header-type-1__menu-wrapper.js-menu > nav > ul > li:nth-child(3) > a"]
        self.contact_link = "#header > div.sb-container > div > div.s-header-type-1__menu-wrapper.js-menu > nav > a"

    def is_logo_visible(self) -> bool:
        return self.is_element_visible(self.logo)

    def click_all_buttons(self):
        for button in self.buttons:
            self.click_element(button)

    def go_to_contact_page(self):
        self.click_element(self.contact_link)