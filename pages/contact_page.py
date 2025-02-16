from pages.base_page import BasePage

class ContactPage(BasePage):
    def __init__(self, page):
        super().__init__(page)
        self.name_input = "#ooalnvy > div.sb-container > form > div:nth-child(3) > div > div.sb-input__wrapper.s-form-type-1__input-wrapper > label"
        self.number_input = "#ooalnvy > div.sb-container > form > div:nth-child(4) > div > div.sb-input__wrapper.s-form-type-1__input-wrapper > label"
        self.submit_button = "#ooalnvy > div.sb-container > form > div.sb-col_lg-6.sb-col_md-6.sb-col_sm-12.sb-col_xs-12.s-form-type-1__submit > input"
        self.success_message = "#ooalnvy > div.sb-container > form > div.sb-col_lg-6.sb-col_md-6.sb-col_sm-12.sb-col_xs-12.s-form-type-1__submit > div.sb-notification.sb-notification_success.sb-m-17-top.sb-font-p3"

    def fill_contact_form(self, name, number):
        self.fill_input(self.name_input, name)
        self.fill_input(self.number_input, number)
        self.click_element(self.submit_button)

    def is_success_message_displayed(self) -> bool:
        return self.is_element_visible(self.success_message)