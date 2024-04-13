import { Hono } from 'hono'
import summary from './routes/summary'
import incongruence from './routes/incongruence'
import crosscheck from './routes/crosscheck';

const app = new Hono();

app.route('/summary', summary);
app.route('/incongruence', incongruence);
app.route('/crosscheck', crosscheck);

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

export default app;
