from playwright.sync_api import Page
from pages.simple_page import SimplePage


def test_logo_exists(page: Page):
    simple_page = SimplePage(page)
    simple_page.open()
    simple_page.check_logo_exists()

def test_trainings_button_exists(page: Page):
    simple_page = SimplePage(page)
    simple_page.open()
    simple_page.check_trainings_exists()

def test_gallery_button_exists(page: Page):
    simple_page = SimplePage(page)
    simple_page.open()
    simple_page.check_gallery_exists()

def test_contact_button_exists(page: Page):
    simple_page = SimplePage(page)
    simple_page.open()
    simple_page.check_contacts_exists()

def test_link_form_button_exists(page: Page):
    simple_page = SimplePage(page)
    simple_page.open()
    simple_page.check_link_form_exists()

