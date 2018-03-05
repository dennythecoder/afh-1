const routes = [];
function addRoute(name, path = "/" + name) {
  routes.push({
    path,
    component: () => import("layouts/default"),
    children: [{ name, path, component: () => import("pages/" + name) }]
  });
}

addRoute("home");
addRoute("toc");
addRoute("searcher");
routes.push({
  path: "/reader/:cfi?",
  name: "reader",
  component: () => import("layouts/default")
});

addRoute("home", "*");

export default routes;
