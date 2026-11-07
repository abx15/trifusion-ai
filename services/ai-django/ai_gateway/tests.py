from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from ai_gateway.views import ready_check


class ReadinessCheckTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("ai_gateway.views.connections.__getitem__")
    def test_ready_when_database_connection_succeeds(self, get_connection):
        connection = Mock()
        get_connection.return_value = connection

        response = ready_check(self.factory.get("/ready"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["dependencies"]["database"], "up")
        connection.ensure_connection.assert_called_once_with()

    @patch("ai_gateway.views.connections.__getitem__")
    def test_not_ready_when_database_connection_fails(self, get_connection):
        connection = Mock()
        connection.ensure_connection.side_effect = RuntimeError("database unavailable")
        get_connection.return_value = connection

        response = ready_check(self.factory.get("/ready"))

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["status"], "not_ready")
        self.assertEqual(response.data["dependencies"]["database"], "down")
