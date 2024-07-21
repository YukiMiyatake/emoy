from django.db import models

# Create your models here.
class AccountsModel(models.Model):
    userName = models.CharField('UserName', max_length=20)
    hoge_id = models.IntegerField()

    def __str__(self):
        return self.userName
    

# UserModelを作成する userNameで一対一でリレーションする
class UserModel(models.Model):
    userName = models.CharField('UserName', max_length=20)
    hoge_id = models.IntegerField()
    account = models.OneToOneField(AccountsModel, on_delete=models.CASCADE)

    def __str__(self):
        return self.userName






