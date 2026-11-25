from django.db import models

# Create your models here.
class Score(models.Model):
    player_name=models.CharField(max_length=50)
    distance=models.FloatField()
    coins=models.IntegerField()
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.player_name