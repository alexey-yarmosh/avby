### Commands:
Run:
```
docker run --name avby -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
node start.js
```

Save:
```
docker commit 6faa99ab5019 avby
docker save avby > docker-container.tar
```
