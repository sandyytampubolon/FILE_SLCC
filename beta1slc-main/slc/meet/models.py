from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    user_id = models.AutoField(primary_key=True)
    user_fullname = models.CharField(max_length=100)
    user_number = models.DecimalField(max_digits=12, decimal_places=2)
    user_photo = models.ImageField(upload_to='photos/')

    def __str__(self):
        return self.username  # Display username when object is called

class Meeting(models.Model):
    id = models.CharField( primary_key=True,max_length=24, default=lambda: str(ObjectId()), editable=False)  # Supports ObjectId as string
    title = models.CharField(max_length=100)
    description = models.TextField()
    participants = models.ManyToManyField(User)  # Link to User model
    created_at = models.DateTimeField(auto_now_add=True)
    code = models.CharField(max_length=6)

    def __str__(self):
        return self.title  # Display title when object is called
