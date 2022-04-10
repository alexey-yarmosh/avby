### Commands:
```
Create volue:
docker volume create avby-volume

Copy data from .tar file to volume:
docker run -v avby-volume:/avby-volume -v $(pwd)/backup:/backup ubuntu bash -c "cd /avby-volume && tar xvf /backup/backup.tar --strip 1"

Run db with the volume:
docker run --name avby -p 5432:5432 -e POSTGRES_PASSWORD=postgres -v avby-volume:/var/lib/postgresql/data postgres

Run app:
node start.js

Save volume data to the .tar file:
docker run -v avby-volume:/avby-volume -v $(pwd)/backup:/backup ubuntu bash -c "tar cvf /backup/backup.tar /avby-volume"
```
