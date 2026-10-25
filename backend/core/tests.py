from django.test import SimpleTestCase, Client

class HealthCheckAPITests(SimpleTestCase):
    def setUp(self):
        self.client = Client()

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('service', data)
        self.assertEqual(data['service'], 'SmartAttend AI Backend')
        self.assertIn('database', data)
        self.assertIn(data['database']['configured_engine'], ['django.db.backends.mysql', 'django.db.backends.sqlite3'])
        self.assertIn('modules', data)

    def test_api_root_endpoint(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('project', data)
        self.assertIn('endpoints', data)
        self.assertEqual(data['endpoints']['health'], '/api/health/')
