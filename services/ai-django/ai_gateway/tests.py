from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from ai_gateway.views import ready_check


class ReadinessCheckTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("ai_gateway.views.connections")
    def test_ready_when_database_connection_succeeds(self, connections):
        database = MagicMock()
        connections.__getitem__.return_value = database

        response = ready_check(self.factory.get("/ready"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["dependencies"]["database"], "up")
        database.ensure_connection.assert_called_once_with()
        database.cursor.assert_called_once_with()

    @patch("ai_gateway.views.connections")
    def test_not_ready_when_database_connection_fails(self, connections):
        database = MagicMock()
        database.ensure_connection.side_effect = RuntimeError("database unavailable")
        connections.__getitem__.return_value = database

        response = ready_check(self.factory.get("/ready"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["status"], "not_ready")
        self.assertEqual(response.data["dependencies"]["database"], "down")
