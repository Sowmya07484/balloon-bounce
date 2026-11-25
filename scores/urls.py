from django.urls import path
from .views import save_score, leaderboard

urlpatterns = [
    path('save/', save_score, name='save_score'),
    path('leaderboard/', leaderboard, name='leaderboard'),
]