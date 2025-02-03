from playwright.sync_api import expect
from pages.base_page import BasePage

LOGO = '//*[@id="header"]/div[2]/div/a[1]/img'
TRAININGS = '//*[@id="header"]/div[2]/div/div[2]/nav/ul/li[1]/a'
GALLERY ='//*[@id="header"]/div[2]/div/div[2]/nav/ul/li[2]/a'
CONTACTS = '//*[@id="header"]/div[2]/div/div[2]/nav/ul/li[3]/a'
LINK_FORM = '//*[@id="header"]/div[2]/div/div[2]/nav/a'


class SimplePage(BasePage):
    url = 'https://zvenfit.ru/'

    def check_logo_exists(self):
        logo = self.page.locator(LOGO)
        expect(logo).to_be_visible()

    def check_trainings_exists(self):
        trainings = self.page.locator(TRAININGS)
        expect(trainings).to_be_visible()

    def check_gallery_exists(self):
        gallery = self.page.locator(GALLERY)
        expect(gallery).to_be_visible()

    def check_contacts_exists(self):
        contacts = self.page.locator(CONTACTS)
        expect(contacts).to_be_visible()

    def check_link_form_exists(self):
        link_form = self.page.locator(LINK_FORM)
        expect(link_form).to_be_visible()

    def click_logo(self):
        logo = self.page.locator(LOGO)
        logo.click()

    def click_trainings(self):
        trainings = self.page.locator(TRAININGS)
        trainings.click()

    def click_gallery(self):
        gallery = self.page.locator(GALLERY)
        gallery.click()

    def click_contacts(self):
        contacts = self.page.locator(CONTACTS)
        contacts.click()

    def click_link_form(self):
        link_form = self.page.locator(LINK_FORM)
        link_form.click()

