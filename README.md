# EduBase Frontend

EduBase Frontend, çevrim içi eğitim platformu EduBase'in React tabanlı kullanıcı arayüzüdür. Uygulama; kurs keşfi, üyelik ve oturum işlemleri, öğrenci paneli, kurs oynatıcı, sepet ve ödeme akışı, profil yönetimi, eğitmen paneli, kurs oluşturma, video yükleme ve final sınavı ekranlarını içerir.

Proje Vite, React, TypeScript ve Nginx üzerine kuruludur. Geliştirme ortamında Vite dev server ile çalışır; üretim ve Kubernetes ortamında statik build çıktısı Nginx üzerinden servis edilir.

## İçindekiler

- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı](#proje-yapısı)
- [Ön Gereksinimler](#ön-gereksinimler)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [IDE Üzerinde Çalıştırma](#ide-üzerinde-çalıştırma)
- [Build ve Önizleme](#build-ve-önizleme)
- [Docker ile Çalıştırma](#docker-ile-çalıştırma)
- [Kubernetes Ortamında Çalıştırma](#kubernetes-ortamında-çalıştırma)
- [Kullanılabilir NPM Komutları](#kullanılabilir-npm-komutları)
- [Uygulama Özellikleri](#uygulama-özellikleri)
- [Sorun Giderme](#sorun-giderme)

## Teknoloji Yığını

- **React 19**: Kullanıcı arayüzü geliştirme
- **TypeScript**: Tip güvenliği
- **Vite**: Geliştirme sunucusu ve build aracı
- **React Router**: Sayfa yönlendirme
- **TanStack React Query**: Sunucu durum yönetimi
- **Axios**: HTTP istemcisi
- **i18next / react-i18next**: Çok dilli arayüz desteği
- **Zod**: Form ve veri doğrulama
- **Tailwind CSS 4**: Stil altyapısı
- **Nginx**: Production statik dosya sunumu
- **Kubernetes**: Container orkestrasyonu

## Proje Yapısı

```text
.
|-- Dockerfile
|-- nginx/
|   `-- default.conf
|-- k8s/
|   |-- frontend.yaml
|   |-- frontend-configmap.yaml
|   |-- frontend-deployment.yaml
|   `-- frontend-service.yaml
|-- public/
|   |-- config.js
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- app/
|   |-- assets/
|   |-- components/
|   |-- config/
|   |-- hooks/
|   |-- i18n/
|   |-- layouts/
|   |-- pages/
|   |-- routes/
|   |-- services/
|   |-- shared/
|   `-- utils/
|-- package.json
|-- tsconfig.json
`-- vite.config.ts
```

Önemli klasörler:

- `src/pages`: Uygulama sayfaları
- `src/components`: Ortak ve sayfaya özel bileşenler
- `src/services`: Backend API çağrıları
- `src/config`: Runtime ve build-time konfigürasyon
- `src/routes`: Route, korumalı route ve rol bazlı erişim yapısı
- `src/i18n`: Türkçe ve İngilizce dil kaynakları
- `k8s`: Kubernetes manifestleri
- `nginx`: Production Nginx konfigürasyonu

## Ön Gereksinimler

IDE üzerinde geliştirme için:

- Node.js 20 veya üzeri
- npm
- Git
- Visual Studio Code, WebStorm veya benzeri bir IDE
- Çalışır durumda EduBase backend/API Gateway

Kubernetes üzerinde çalıştırma için:

- Docker
- kubectl
- Docker Desktop Kubernetes, Minikube, Kind veya erişilebilir bir Kubernetes cluster
- Backend servislerinin veya API Gateway'in erişilebilir olması

Varsayılan API Gateway adresi:

```text
http://localhost:30090
```

## Ortam Değişkenleri

Uygulamanın temel API adresi `VITE_API_BASE_URL` değişkeni ile belirlenir.

Örnek `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:30090
VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME=file
```

Kullanılan önemli değişkenler:

| Değişken | Açıklama | Varsayılan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API Gateway adresi | `http://localhost:30090` |
| `VITE_PROFILE_MEDIA_UPLOAD_URL` | Profil fotoğrafı yükleme endpoint'i | `/api/v1/users/me/avatar` |
| `VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME` | Multipart dosya alan adı | `file` |

Konfigürasyon önceliği:

1. Runtime konfigürasyon: `window.__EDUBASE_CONFIG__.API_BASE_URL`
2. Vite ortam değişkeni: `VITE_API_BASE_URL`
3. Kod içindeki fallback: `http://localhost:30090`

Bu nedenle Kubernetes ortamında API adresi genellikle image yeniden build edilmeden `ConfigMap` içindeki `config.js` ile değiştirilir.

## IDE Üzerinde Çalıştırma

### 1. Repoyu klonlayın

```bash
git clone <repository-url>
cd education-platform-frontend-react
```

### 2. Bağımlılıkları yükleyin

```bash
npm ci
```

`npm ci`, `package-lock.json` dosyasına göre temiz ve tekrarlanabilir kurulum yapar. Yeni bağımlılık eklenecekse `npm install <paket-adı>` kullanılabilir.

### 3. Ortam dosyasını hazırlayın

```bash
cp .env.local.example .env.local
```

Windows PowerShell kullanıyorsanız:

```powershell
Copy-Item .env.local.example .env.local
```

Ardından `.env.local` içindeki API adresini kendi backend ortamınıza göre güncelleyin:

```env
VITE_API_BASE_URL=http://localhost:30090
VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME=file
```

### 4. Backend/API Gateway'i çalıştırın

Frontend tek başına açılabilir, ancak giriş, kurs listeleme, ödeme, profil ve eğitmen işlemleri için backend servislerinin erişilebilir olması gerekir.

Varsayılan frontend beklentisi:

```text
API Gateway: http://localhost:30090
```

Backend farklı bir portta veya hostta çalışıyorsa `.env.local` içindeki `VITE_API_BASE_URL` değerini değiştirin.

### 5. Uygulamayı başlatın

```bash
npm run dev:local
```

Alternatif olarak varsayılan Vite modu ile:

```bash
npm run dev
```

Vite dev server genellikle şu adreste açılır:

```text
http://localhost:5173
```

Port doluysa Vite otomatik olarak başka bir port seçebilir. Terminal çıktısındaki adresi kullanın.

### 6. IDE önerileri

Visual Studio Code için önerilen akış:

1. Proje klasörünü IDE ile açın.
2. Terminali proje kökünde açın.
3. `npm ci` komutunu çalıştırın.
4. `.env.local` dosyasını oluşturun.
5. `npm run dev:local` komutu ile uygulamayı başlatın.
6. Tarayıcıdan Vite'in verdiği local adresi açın.

## Build ve Önizleme

TypeScript kontrolü ve production build için:

```bash
npm run build
```

Build çıktısı `dist/` klasörüne yazılır.

Production build'i local olarak önizlemek için:

```bash
npm run preview
```

Kubernetes moduna göre build almak için:

```bash
npm run build:k8s
```

Production mode build için:

```bash
npm run build:prod
```

## Docker ile Çalıştırma

Proje çok aşamalı Docker build kullanır:

1. `node:20-alpine` image'ı ile bağımlılıklar kurulur ve Vite build alınır.
2. Build çıktısı `nginx:1.27-alpine` image'ına kopyalanır.
3. Uygulama Nginx üzerinden `80` portunda servis edilir.

### Docker image build

```bash
docker build -t edubase/frontend:v7 .
```

API adresini build sırasında vermek isterseniz:

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:30090 -t edubase/frontend:v7 .
```

### Container çalıştırma

```bash
docker run --rm -p 30080:80 edubase/frontend:v7
```

Tarayıcıdan açın:

```text
http://localhost:30080
```

Not: Docker image içinde `public/config.js` dosyası da build çıktısına taşınır. Runtime API adresini image build etmeden değiştirmek için container içine farklı bir `config.js` mount edilebilir.

Örnek:

```bash
docker run --rm -p 30080:80 -v "$(pwd)/public/config.js:/usr/share/nginx/html/config.js:ro" edubase/frontend:v7
```

Windows PowerShell için:

```powershell
docker run --rm -p 30080:80 -v "${PWD}\public\config.js:/usr/share/nginx/html/config.js:ro" edubase/frontend:v7
```

## Kubernetes Ortamında Çalıştırma

Kubernetes manifestleri `k8s/` klasöründedir.

Mevcut Kubernetes kaynakları:

- `Namespace`: `edubase`
- `ConfigMap`: `frontend-config`
- `Deployment`: `frontend`
- `Service`: `frontend`
- Service tipi: `NodePort`
- Dış port: `30080`
- Container portu: `80`
- Kullanılan image: `edubase/frontend:v7`

### 1. Image oluşturun

```bash
docker build -t edubase/frontend:v7 .
```

Docker Desktop Kubernetes kullanıyorsanız bu image genellikle doğrudan cluster tarafından görülebilir.

Minikube kullanıyorsanız image'ı Minikube Docker ortamında build edin:

```bash
minikube docker-env
```

PowerShell:

```powershell
minikube docker-env | Invoke-Expression
docker build -t edubase/frontend:v7 .
```

Bash:

```bash
eval $(minikube docker-env)
docker build -t edubase/frontend:v7 .
```

Uzak bir Kubernetes cluster kullanıyorsanız image'ı registry'ye push edin ve `k8s/frontend-deployment.yaml` veya `k8s/frontend.yaml` içindeki image adını güncelleyin:

```yaml
image: registry.example.com/edubase/frontend:v7
```

### 2. API adresini ayarlayın

Kubernetes ortamında runtime API adresi `ConfigMap` ile verilir.

`k8s/frontend-configmap.yaml` veya birleşik manifest olan `k8s/frontend.yaml` içinde:

```js
window.__EDUBASE_CONFIG__ = {
  API_BASE_URL: "http://localhost:30090"
};
```

Backend API Gateway cluster içindeyse örnek değer şu şekilde olabilir:

```js
window.__EDUBASE_CONFIG__ = {
  API_BASE_URL: "http://api-gateway.edubase.svc.cluster.local:8080"
};
```

Ingress üzerinden aynı domain altında `/api` path'i ile yayın yapıyorsanız:

```js
window.__EDUBASE_CONFIG__ = {
  API_BASE_URL: "/api"
};
```

### 3. Manifestleri uygulayın

Tüm frontend kaynaklarını tek dosyadan uygulamak için:

```bash
kubectl apply -f k8s/frontend.yaml
```

Ayrı dosyalarla uygulamak isterseniz namespace'i önce oluşturmanız gerekir. Birleşik `frontend.yaml` zaten namespace içerir.

```bash
kubectl create namespace edubase
kubectl apply -f k8s/frontend-configmap.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

Namespace zaten varsa `kubectl create namespace edubase` komutu hata verebilir; bu durumda devam edebilirsiniz.

### 4. Pod ve servis durumunu kontrol edin

```bash
kubectl get pods -n edubase
kubectl get svc -n edubase
kubectl describe deployment frontend -n edubase
```

Logları görmek için:

```bash
kubectl logs -n edubase deployment/frontend
```

### 5. Uygulamaya erişin

Service `NodePort` olarak tanımlıdır:

```yaml
nodePort: 30080
```

Docker Desktop Kubernetes için:

```text
http://localhost:30080
```

Minikube için:

```bash
minikube service frontend -n edubase
```

Alternatif olarak port-forward kullanabilirsiniz:

```bash
kubectl port-forward -n edubase svc/frontend 30080:80
```

Ardından:

```text
http://localhost:30080
```

### 6. Güncelleme akışı

Frontend kodu değiştiğinde:

```bash
docker build -t edubase/frontend:v8 .
```

Deployment manifestindeki image tag'ini güncelleyin:

```yaml
image: edubase/frontend:v8
```

Sonra manifesti tekrar uygulayın:

```bash
kubectl apply -f k8s/frontend.yaml
```

Rollout durumunu izleyin:

```bash
kubectl rollout status deployment/frontend -n edubase
```

Sadece ConfigMap değiştiyse:

```bash
kubectl apply -f k8s/frontend-configmap.yaml
kubectl rollout restart deployment/frontend -n edubase
```

## Kullanılabilir NPM Komutları

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Vite geliştirme sunucusunu varsayılan modda başlatır |
| `npm run dev:local` | Local environment ile geliştirme sunucusunu başlatır |
| `npm run dev:k8s` | Kubernetes ortam değişkenleriyle geliştirme sunucusunu başlatır |
| `npm run dev:ingress` | Ingress odaklı environment ile geliştirme sunucusunu başlatır |
| `npm run dev:docker` | Docker environment ile geliştirme sunucusunu başlatır |
| `npm run build` | TypeScript kontrolü yapar ve production build üretir |
| `npm run build:k8s` | Kubernetes mode ile production build üretir |
| `npm run build:ingress` | Ingress mode ile production build üretir |
| `npm run build:docker` | Docker mode ile production build üretir |
| `npm run build:prod` | Production mode ile build üretir |
| `npm run preview` | Build çıktısını local olarak önizler |

## Uygulama Özellikleri

Öne çıkan kullanıcı akışları:

- Landing page ve herkese açık kurs kataloğu
- Kullanıcı kaydı, giriş, şifre sıfırlama ve hesap reaktivasyonu
- Korumalı dashboard alanı
- Profil tamamlama ve profil güncelleme
- Kurs listeleme, kurs detayları ve arama
- Sepet ve ödeme ekranları
- Satın alınan/kayıt olunan kurslar
- Kurs oynatıcı ve ders ilerleme takibi
- Final sınavı görüntüleme, sınav çözme ve sonuç ekranı
- Eğitmen başvuru ve eğitmen profili
- Eğitmen dashboard'u
- Eğitmen kurs oluşturma ve video yükleme
- Rol bazlı route koruması (`ROLE_INSTRUCTOR`, `ROLE_ADMIN` vb.)
- Türkçe/İngilizce çok dil desteği
- Açık/koyu tema desteği

Backend tarafında beklenen başlıca servis alanları:

- Auth Service
- User Service
- Course Service
- Enrollment Service
- Payment Service
- Review Service
- Search/Recommendation servisleri
- API Gateway

Frontend API çağrıları genel olarak `/api/v1/...` path'leri üzerinden yapılır ve `VITE_API_BASE_URL` ile verilen gateway adresine bağlanır.

## Nginx Davranışı

Production image içinde Nginx SPA routing destekleyecek şekilde ayarlanmıştır:

- `/` altındaki bilinmeyen route'lar `index.html` dosyasına düşer.
- `/config.js` cache'lenmez.
- `/index.html` cache'lenmez.
- Statik asset'ler doğrulamalı cache header'ları ile servis edilir.

Bu yapı React Router kullanan tek sayfa uygulamalar için gereklidir. Örneğin `/dashboard/courses/123` gibi bir route doğrudan tarayıcıdan açıldığında Nginx bu isteği `index.html` üzerinden uygulamaya iletir.

## Sorun Giderme

### Uygulama açılıyor ama API çağrıları başarısız oluyor

Kontrol edin:

- Backend/API Gateway çalışıyor mu?
- `VITE_API_BASE_URL` doğru mu?
- Kubernetes ortamında `frontend-config` ConfigMap içindeki `API_BASE_URL` doğru mu?
- Tarayıcı Network sekmesinde istekler hangi host ve porta gidiyor?
- Backend tarafında CORS ayarları frontend origin'ine izin veriyor mu?

### Kubernetes pod `ImagePullBackOff` durumunda kalıyor

Olası nedenler:

- Image local cluster tarafından görülemiyor.
- Image registry'ye push edilmedi.
- Manifestteki image adı veya tag hatalı.

Çözüm:

```bash
kubectl describe pod -n edubase <pod-adı>
```

Minikube kullanıyorsanız image'ı Minikube Docker ortamında build ettiğinizden emin olun.

### ConfigMap değişti ama uygulama eski API adresini kullanıyor

ConfigMap volume olarak mount edildiği için pod'un yeniden başlatılması en temiz yöntemdir:

```bash
kubectl rollout restart deployment/frontend -n edubase
```

Ardından:

```bash
kubectl rollout status deployment/frontend -n edubase
```

### Tarayıcıda 404 alıyorum

Production ortamında Nginx'in `nginx/default.conf` dosyasındaki SPA fallback ayarı kullanılmalıdır:

```nginx
location / {
  try_files $uri /index.html;
}
```

Dockerfile mevcut Nginx konfigürasyonunu image içine kopyalar. Farklı bir Nginx veya ingress kullanılıyorsa aynı SPA fallback davranışı korunmalıdır.

### TypeScript veya build hatası alıyorum

Temiz kurulum deneyin:

```bash
rm -rf node_modules
npm ci
npm run build
```

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
npm run build
```

## Katkı ve Geliştirme Notları

- Kod değişikliklerinden sonra en azından `npm run build` çalıştırılması önerilir.
- API endpoint değişikliklerinde `src/services` altındaki servis dosyaları kontrol edilmelidir.
- Route eklerken `src/routes/AppRouter.tsx` ve gerekiyorsa `src/utils/constants.ts` güncellenmelidir.
- Yeni kullanıcı metinleri için `src/i18n/resources.ts` içindeki Türkçe ve İngilizce kaynaklar birlikte güncellenmelidir.
- Production ve Kubernetes ortamlarında API adresini değiştirmek için öncelikle `config.js`/`ConfigMap` tercih edilmelidir.
