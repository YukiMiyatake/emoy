from django.contrib import admin
from .models import AccountsModel

# Register your models here.
class AccountsAdmin(admin.ModelAdmin):
    list_display = ['userName', 'hoge_id']
    ##search_fields = ['UserName']

admin.site.register(AccountsModel, AccountsAdmin)