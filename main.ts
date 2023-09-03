import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { GraphQLService } from "./graphql.ts";

const router = new Router();
router
  .get("/", (context) => {
    context.response.headers.set("Content-Type", "text/html; charset=utf-8");
    context.response.body = `see: <a
        href="https://todays-mitsui-torends.deno.dev/graphql"
      >https://todays-mitsui-torends.deno.dev/graphql</a>`;
  });

const app = new Application();
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());
app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

await app.listen({ port: 8000 });
