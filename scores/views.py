from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Score

@csrf_exempt
def save_score(request):
    if request.method == "POST":
        data = json.loads(request.body)

        Score.objects.create(
            player_name=data["player_name"],
            distance=data["distance"],
            coins=data["coins"]
        )

        return JsonResponse({"message": "Score saved!"})

    return JsonResponse({"error": "POST required"})
def leaderboard(request):
    scores = Score.objects.order_by('-distance')[:10]

    data = [
        {
            "player_name": score.player_name,
            "distance": score.distance,
            "coins": score.coins
        }
        for score in scores
    ]

    return JsonResponse(data, safe=False)