# Task Planner API

Bu projede basit bir task planner API yaptım. Backend için NestJS, veritabanı için MongoDB kullandım.

Book Management API projesinden sonra yaptığım ikinci backend çalışması oldu. İlk projede daha çok NestJS yapısını, controller, service, module mantığını ve temel CRUD işlemlerini öğrenmiştim.

Bu projede onun üstüne login, JWT token, guard kullanımı, admin/user ayrımı ve MongoDB'de user, project, task ilişkisini eklemeye çalıştım.

Dosyaları oluştururken çoğunlukla Nest CLI kullandım. Bu biraz rahata kaçmak gibi görünebilir ama amacım dosya isimlerini ve module/controller/service yapısını NestJS standardına uygun kurmaktı.

Böylece klasör yapısıyla çok vakit kaybetmeden auth, guard, role kontrolü ve MongoDB ilişkilerine odaklandım. Daha sonra NestJS dokümantasyonuna bakarak dosyaların içini bu taska göre doldurdum.

## Kendi notlarım

React tarafında component, props ve state yapısına alışık olduğum için NestJS'teki parçalı yapı bana ilk başta biraz benzer geldi. Controller'ı dışarıdan gelen istekleri alan yer, service'i de asıl işlemleri yapan yer gibi düşününce daha kolay oturdu.

En rahat yaptığım kısım controller, service ve DTO dosyalarını ayırmak oldu. Book Management API'de CRUD yapısını gördüğüm için burada project ve task endpointlerini yazmak daha anlaşılır geldi.

En zorlandığım yer JWT ve guard kısmıydı. Login'den token dönüyordu ama token'ı alıp request içinde kullanıcı bilgisine çevirmek ilk başta karışık geldi. `JwtGuard` ve `RolesGuard` yapısını NestJS dokümantasyonuna bakarak yaptım.

MongoDB tarafında da ilk defa user, project ve task arasında ilişki kurmayı denedim. `assignedTo`, `createdBy` ve `project` alanlarında ObjectId kullanmam gerektiğini bu projede daha net anladım.

## Neler var?

- Kullanıcı kayıt olabilir
- Kullanıcı login olabilir
- Login olunca JWT token döner
- Admin ve user rolü vardır
- Admin proje oluşturabilir
- Admin task oluşturup user'a atayabilir
- User sadece kendisine atanmış taskları görebilir
- User sadece kendi taskının durumunu değiştirebilir

Admin kullanıcıyı test edebilmek için `role` alanını register sırasında gönderebiliyorum. Gerçek bir projede bunu bu şekilde açık bırakmak doğru olmaz, ama bu taskta admin/user ayrımını test etmek için basit tuttum.

Task durumları:

- `not_started`
- `in_progress`
- `done`

## Kullandıklarım

- NestJS
- MongoDB
- Mongoose
- JWT
- bcrypt
- class-validator

## Kurulum

Paketleri yüklemek için:

```bash
npm install
```

`.env` dosyası:

```env
MONGODB_URI=mongodb://localhost:27017/task-planner-api
JWT_SECRET=your_jwt_secret
```

Projeyi çalıştırmak için:

```bash
npm run start:dev
```

## Örnek istekler

Admin kayıt:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mail.com",
    "password": "123456",
    "role": "admin"
  }'
```

User kayıt:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@mail.com",
    "password": "123456"
  }'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mail.com",
    "password": "123456"
  }'
```

Admin ile proje oluşturma:

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "First Project",
    "description": "Simple project"
  }'
```

Admin ile task oluşturma:

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "Prepare API",
    "description": "Finish task planner API",
    "project": "PROJECT_ID",
    "assignedTo": "USER_ID"
  }'
```

User ile kendi tasklarını görme:

```bash
curl http://localhost:3000/tasks/my-tasks \
  -H "Authorization: Bearer USER_TOKEN"
```

User ile task durumunu değiştirme:

```bash
curl -X PATCH http://localhost:3000/tasks/TASK_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "status": "done"
  }'
```

## Test

Unit test:

```bash
npm run test
```

E2E test:

```bash
npm run test:e2e
```

E2E testte ana akışı denedim:

- admin ve user register
- login
- proje oluşturma
- task oluşturma
- user'ın kendi tasklarını görmesi
- user'ın task status güncellemesi

## Güncelleme notları

Gelen geri bildirimlerden sonra projeye birkaç ekleme yaptım:

- Swagger ekledim. API dokümanına `http://localhost:3000/api` adresinden bakılabilir.
- Service'lere NestJS `Logger` ekledim.
- MongoDB'yi lokalde daha kolay çalıştırmak için `docker-compose.yml` ekledim.
- Global validation ayarını biraz daha sıkı tuttum: `whitelist`, `forbidNonWhitelisted` ve `transform` açık.
- Task oluştururken project ve assigned user gerçekten var mı diye kontrol ekledim.
- Unit test tarafında task create, listeleme, status update ve bazı hata durumlarını denedim.
- E2E testte auth, role kontrolü, task sahipliği ve yanlış status gibi birkaç senaryoyu da ekledim.

MongoDB lokalde kurulu değilse şu komutla çalıştırılabilir:

```bash
docker compose up -d
```
