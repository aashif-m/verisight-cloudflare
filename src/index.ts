import { Hono } from 'hono'
import summary from './routes/summary'
import incongruence from './routes/incongruence'

const app = new Hono();

app.route('/summary', summary);
app.route('/incongruence', incongruence);

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

export default app;
