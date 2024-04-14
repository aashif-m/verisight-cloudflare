import { Hono } from 'hono'
import summary from './routes/summary'
import incongruence from './routes/incongruence'
import crosscheck from './routes/crosscheck';
import auth from './routes/auth';
import user from './routes/user';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(
  '/*',
  cors({
    origin: 'http://localhost:5173'
  })
)

app.route('/summary', summary);
app.route('/incongruence', incongruence);
app.route('/crosscheck', crosscheck);
app.route('/auth', auth);
app.route('/user', user);

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

export default app;
