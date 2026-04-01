# Backend Requirements

Bu dokuman, mevcut frontend'in gercek backend ile calismasi icin ihtiyac duydugu endpoint ve entity alanlarini listeler.

## 1. Temel Varsayimlar

- Kimlik dogrulama `JWT access token` ile yapiliyor.
- Frontend `en` ve `tr` dil destegine sahip. Backend ya:
  - `Accept-Language` header'i okuyabilir
  - veya `?lang=en|tr` query param kabul edebilir
- Cart ve satin alinmis kurslar su an frontend'de `localStorage` ile tutuluyor.
- Production ortaminda bunlar backend tarafinda tutulmali.

## 2. Gerekli Endpointler

### Auth

#### `POST /auth/login`

Request:

```json
{
  "email": "user@company.com",
  "password": "string"
}
```

Response:

```json
{
  "token": "jwt-access-token",
  "user": {
    "id": "usr_01",
    "name": "Avery Coleman",
    "email": "avery@company.com",
    "roleLabelKey": "user.roles.learningLead",
    "avatarColor": "from-cyan-400 to-blue-500",
    "initials": "AC"
  }
}
```

#### `POST /auth/register`

Request:

```json
{
  "name": "Avery Coleman",
  "email": "user@company.com",
  "password": "string"
}
```

Response:

```json
{
  "token": "jwt-access-token",
  "user": {
    "id": "usr_01",
    "name": "Avery Coleman",
    "email": "avery@company.com",
    "roleLabelKey": "user.roles.learningLead",
    "avatarColor": "from-cyan-400 to-blue-500",
    "initials": "AC"
  }
}
```

#### `POST /auth/logout`

Response:

```json
{
  "success": true
}
```

#### `GET /auth/me`

Not:
- Su an frontend localStorage'dan user restore ediyor.
- Production icin `/auth/me` gerekli.

Response:

```json
{
  "id": "usr_01",
  "name": "Avery Coleman",
  "email": "avery@company.com",
  "roleLabelKey": "user.roles.learningLead",
  "avatarColor": "from-cyan-400 to-blue-500",
  "initials": "AC"
}
```

#### Tavsiye Edilen

- `POST /auth/refresh`

---

### Dashboard

#### `GET /dashboard/overview`

Purpose:
- Dashboard ana sayfasi
- metric kartlari
- recent activity
- focus course
- upcoming milestones

Query:

- `lang=en|tr`

Response:

```json
{
  "metrics": [
    {
      "label": "Courses in progress",
      "value": "12",
      "change": "+18%",
      "trend": "up",
      "tone": "cyan"
    }
  ],
  "recentActivity": [
    {
      "id": "act_01",
      "title": "Finished module: Prioritization frameworks",
      "description": "Product Strategy Foundations",
      "time": "12 minutes ago",
      "tag": "Completed"
    }
  ],
  "focusCourse": {
    "id": "course_01",
    "slug": "product-strategy-foundations",
    "title": "Product Strategy Foundations"
  },
  "upcomingMilestones": [
    {
      "id": "mil_01",
      "label": "Live critique with design mentors",
      "due": "Today, 3:00 PM",
      "status": "Ready"
    }
  ]
}
```

---

### Courses

#### `GET /courses`

Purpose:
- Kurs listesi
- kart/grid gosterimi
- kategori filtreleri

Query:

- `lang=en|tr`
- `category`
- `level`
- `q`
- `page`
- `limit`

Response:

```json
{
  "items": [
    {
      "id": "course_01",
      "slug": "product-strategy-foundations",
      "title": "Product Strategy Foundations",
      "category": "Product",
      "level": "Intermediate",
      "duration": "6 weeks",
      "lessons": 18,
      "progress": 72,
      "students": "1.2k",
      "rating": 4.9,
      "price": 249,
      "accent": "from-cyan-500/30 via-sky-500/10 to-transparent",
      "summary": "Build a product operating model...",
      "tags": ["Roadmapping", "OKRs"],
      "isPurchased": false,
      "isInCart": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

Not:
- Su an frontend `Course[]` bekliyor.
- Production icin `items + pagination` donmek daha saglikli.

#### `GET /courses/:slug`

Purpose:
- Kurs detay sayfasi
- satin alma alani
- module breakdown
- egitmen bilgileri

Query:

- `lang=en|tr`

Response:

```json
{
  "id": "course_01",
  "slug": "product-strategy-foundations",
  "title": "Product Strategy Foundations",
  "category": "Product",
  "level": "Intermediate",
  "duration": "6 weeks",
  "lessons": 18,
  "progress": 72,
  "students": "1.2k",
  "rating": 4.9,
  "price": 249,
  "accent": "from-cyan-500/30 via-sky-500/10 to-transparent",
  "summary": "Build a product operating model...",
  "description": "A structured program...",
  "outcomes": ["Design a repeatable prioritization workflow"],
  "tags": ["Roadmapping", "OKRs"],
  "modules": [
    {
      "id": "m1",
      "title": "Market signals and opportunity sizing",
      "duration": "42 min",
      "type": "Workshop",
      "completed": true
    }
  ],
  "instructor": {
    "name": "Maya Patel",
    "role": "VP Product, Northstar Labs",
    "bio": "Maya helps product organizations..."
  },
  "isPurchased": false,
  "isInCart": false
}
```

#### `GET /courses/:slug/player`

Purpose:
- Video oynatici sayfasi
- satin alinmis kurs kontrolu
- lesson/module listesi
- aktif video source

Query:

- `lang=en|tr`

Response:

```json
{
  "course": {
    "id": "course_01",
    "slug": "product-strategy-foundations",
    "title": "Product Strategy Foundations",
    "description": "A structured program...",
    "accent": "from-cyan-500/30 via-sky-500/10 to-transparent",
    "tags": ["Roadmapping", "OKRs"],
    "instructor": {
      "name": "Maya Patel",
      "role": "VP Product, Northstar Labs",
      "bio": "Maya helps product organizations..."
    },
    "outcomes": ["Design a repeatable prioritization workflow"]
  },
  "access": {
    "isPurchased": true
  },
  "modules": [
    {
      "id": "m1",
      "title": "Market signals and opportunity sizing",
      "duration": "42 min",
      "type": "Workshop",
      "completed": true,
      "videoUrl": "https://cdn.example.com/video-1.mp4",
      "thumbnailUrl": "https://cdn.example.com/thumb-1.jpg",
      "order": 1
    }
  ]
}
```

Not:
- Gercek sistemde `videoUrl` signed URL / tokenized stream olabilir.
- Satin alinmadiysa backend `403` donebilir veya `access.isPurchased=false` dondurebilir.

---

### Search

#### `GET /search`

Purpose:
- Search page
- query, category, level filtreleri

Query:

- `lang=en|tr`
- `query`
- `category`
- `level`

Response:

```json
{
  "filters": {
    "categories": ["Product", "Design", "Analytics"],
    "levels": ["Beginner", "Intermediate", "Advanced"]
  },
  "results": [
    {
      "id": "course_01",
      "slug": "product-strategy-foundations",
      "title": "Product Strategy Foundations",
      "category": "Product",
      "level": "Intermediate",
      "duration": "6 weeks",
      "lessons": 18,
      "progress": 72,
      "students": "1.2k",
      "rating": 4.9,
      "price": 249,
      "accent": "from-cyan-500/30 via-sky-500/10 to-transparent",
      "summary": "Build a product operating model...",
      "tags": ["Roadmapping", "OKRs"]
    }
  ]
}
```

---

### Cart

Production icin cart backend'e alinmali.

#### `GET /cart`

Response:

```json
{
  "id": "cart_01",
  "userId": "usr_01",
  "items": [
    {
      "courseId": "course_01",
      "course": {
        "id": "course_01",
        "slug": "product-strategy-foundations",
        "title": "Product Strategy Foundations",
        "category": "Product",
        "level": "Intermediate",
        "price": 249,
        "summary": "Build a product operating model...",
        "accent": "from-cyan-500/30 via-sky-500/10 to-transparent"
      }
    }
  ],
  "summary": {
    "itemCount": 1,
    "subtotal": 249,
    "tax": 20,
    "total": 269
  }
}
```

#### `POST /cart/items`

Request:

```json
{
  "courseId": "course_01"
}
```

Response:

- guncel cart

#### `DELETE /cart/items/:courseId`

Response:

- guncel cart

#### `DELETE /cart`

Response:

```json
{
  "success": true
}
```

---

### Checkout / Orders / Payments

Su an UI credit card ve invoice secenegi sunuyor. Gercek backend icin `preview + create order + payment initiation` akisi gerekir.

#### `POST /checkout/preview`

Purpose:
- Ara toplam, vergi, toplam hesaplama
- price drift / discount / campaign kontrolu

Request:

```json
{
  "courseIds": ["course_01", "course_02"]
}
```

Response:

```json
{
  "itemCount": 2,
  "subtotal": 578,
  "tax": 46,
  "total": 624,
  "currency": "USD",
  "items": [
    {
      "courseId": "course_01",
      "title": "Product Strategy Foundations",
      "price": 249
    }
  ]
}
```

#### `POST /orders`

Purpose:
- Satin alma / siparis olusturma
- Kurslari unlock etme

Request:

```json
{
  "courseIds": ["course_01", "course_02"],
  "paymentMethod": "card",
  "paymentData": {
    "cardHolder": "Avery Coleman",
    "paymentMethodToken": "pm_123"
  }
}
```

Invoice icin:

```json
{
  "courseIds": ["course_01"],
  "paymentMethod": "invoice",
  "invoiceData": {
    "companyName": "Northstar Labs",
    "taxId": "1234567890",
    "billingEmail": "finance@company.com",
    "billingAddress": "Street, City, Country"
  }
}
```

Response:

```json
{
  "orderId": "ord_01",
  "status": "paid",
  "purchasedCourseIds": ["course_01", "course_02"],
  "accessGranted": true
}
```

Not:
- Kart verisini backend'e raw gondermek yerine PSP token / intent id kullanmak daha dogru.
- UI su an raw form aliyor, ama production'da Stripe/Iyzico tokenization onerilir.

#### `GET /orders/:orderId`

Purpose:
- Siparis sonucu / payment durumu / invoice durumu

---

### Library / Purchased Courses

#### `GET /me/library`

Purpose:
- Satin alinmis kurslar
- oyuncu sayfasi access check
- kartlarda `Watch course` butonu gosterimi

Query:

- `lang=en|tr`

Response:

```json
{
  "items": [
    {
      "courseId": "course_01",
      "purchasedAt": "2026-03-27T10:00:00Z",
      "accessStatus": "active",
      "course": {
        "id": "course_01",
        "slug": "product-strategy-foundations",
        "title": "Product Strategy Foundations",
        "summary": "Build a product operating model...",
        "accent": "from-cyan-500/30 via-sky-500/10 to-transparent"
      }
    }
  ]
}
```

#### `GET /me/library/:courseId/access`

Response:

```json
{
  "courseId": "course_01",
  "isPurchased": true,
  "accessStatus": "active"
}
```

---

## 3. Entity Listesi

## User

```ts
type User = {
  id: string
  name: string
  email: string
  roleLabelKey: string
  avatarColor: string
  initials: string
}
```

Not:
- `roleLabelKey` yerine backend `roleCode` donebilir, frontend mapleyebilir.
- `avatarColor` UI convenience field. Backend uretmeyebilir, frontend derive edebilir.

## AuthSession

```ts
type AuthSession = {
  token: string
  refreshToken?: string
  expiresAt?: string
  user: User
}
```

## Instructor

```ts
type Instructor = {
  id?: string
  name: string
  role: string
  bio: string
  avatarUrl?: string
}
```

## CourseModule

```ts
type CourseModule = {
  id: string
  courseId: string
  title: string
  duration: string
  type: string
  completed: boolean
  order?: number
  videoUrl?: string
  thumbnailUrl?: string
}
```

## Course

```ts
type Course = {
  id: string
  slug: string
  title: string
  category: string
  level: string
  duration: string
  lessons: number
  progress: number
  students: string
  rating: number
  price: number
  accent: string
  summary: string
  description: string
  outcomes: string[]
  tags: string[]
  modules: CourseModule[]
  instructor: Instructor
  isPurchased?: boolean
  isInCart?: boolean
}
```

Not:
- `students` su an string. Backend tarafinda sayisal tutup frontend formatlayabilir:
  - `studentsCount: number`
- `accent` tamamen UI field'i. Backend vermek zorunda degil.
- `progress` su an kurs listesi ve detayda kullaniliyor.

## MetricCard

```ts
type MetricCard = {
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  tone: 'cyan' | 'emerald' | 'amber' | 'indigo'
}
```

## ActivityItem

```ts
type ActivityItem = {
  id: string
  title: string
  description: string
  time: string
  tag: string
}
```

## Milestone

```ts
type Milestone = {
  id: string
  label: string
  due: string
  status: string
}
```

## DashboardOverview

```ts
type DashboardOverview = {
  metrics: MetricCard[]
  recentActivity: ActivityItem[]
  focusCourse: Course
  upcomingMilestones: Milestone[]
}
```

## CartItem

```ts
type CartItem = {
  courseId: string
  course: Pick<
    Course,
    'id' | 'slug' | 'title' | 'category' | 'level' | 'price' | 'summary' | 'accent'
  >
}
```

## Cart

```ts
type Cart = {
  id: string
  userId: string
  items: CartItem[]
  summary: {
    itemCount: number
    subtotal: number
    tax: number
    total: number
    currency?: string
  }
}
```

## Order

```ts
type Order = {
  id: string
  userId: string
  status: 'pending' | 'paid' | 'failed' | 'invoice_requested'
  paymentMethod: 'card' | 'invoice'
  subtotal: number
  tax: number
  total: number
  currency: string
  items: Array<{
    courseId: string
    unitPrice: number
  }>
  createdAt: string
}
```

## InvoiceInfo

```ts
type InvoiceInfo = {
  companyName: string
  taxId: string
  billingEmail: string
  billingAddress: string
}
```

## LibraryItem

```ts
type LibraryItem = {
  courseId: string
  purchasedAt: string
  accessStatus: 'active' | 'expired' | 'revoked'
  course: Pick<Course, 'id' | 'slug' | 'title' | 'summary' | 'accent'>
}
```

## SearchResponse

```ts
type SearchResponse = {
  filters: {
    categories: string[]
    levels: string[]
  }
  results: Course[]
}
```

---

## 4. Sayfa Bazli Veri Ihtiyaci

### Login

Ihtiyac:
- `POST /auth/login`

Alanlar:
- `email`
- `password`
- `token`
- `user`

### Register

Ihtiyac:
- `POST /auth/register`

Alanlar:
- `name`
- `email`
- `password`

### Dashboard

Ihtiyac:
- `GET /dashboard/overview`

Alanlar:
- metrics
- recentActivity
- focusCourse
- upcomingMilestones

### Course List

Ihtiyac:
- `GET /courses`

Alanlar:
- course card alanlari
- optional `isPurchased`
- optional `isInCart`

### Course Detail

Ihtiyac:
- `GET /courses/:slug`

Alanlar:
- course detay alanlari
- modules
- instructor
- access/cart state

### Search

Ihtiyac:
- `GET /search`

Alanlar:
- filters.categories
- filters.levels
- results[]

### Cart

Ihtiyac:
- `GET /cart`
- `POST /cart/items`
- `DELETE /cart/items/:courseId`
- `DELETE /cart`

Alanlar:
- item listesi
- totals

### Payment

Ihtiyac:
- `POST /checkout/preview`
- `POST /orders`

Alanlar:
- subtotal
- tax
- total
- order status
- access granted

### Course Player

Ihtiyac:
- `GET /courses/:slug/player`
- veya `GET /courses/:slug` + `GET /me/library/:courseId/access`

Alanlar:
- access state
- modules
- videoUrl
- instructor
- outcomes

---

## 5. Kritik Notlar

- Kart ve satin alinmis kurs bilgisi su an frontend localStorage'da.
- Production icin bunlar backend kaynakli olmali.
- `price`, `tax`, `total` backend tarafinda hesaplanmali.
- `videoUrl` public olmamali; signed URL veya protected streaming onerilir.
- Localized text alanlari backend'de ya locale bazli donmeli ya da frontend translation key bazli tasarim yapilmali.
- UI'daki bazi alanlar backend entity alani olmak zorunda degil:
  - `accent`
  - `avatarColor`
  - `roleLabelKey`
- Bunlar frontend tarafinda derive edilebilir.

## 6. Minimum MVP Backend Checklist

- Auth login/register/logout/me
- Dashboard overview
- Course list
- Course detail
- Search
- Cart CRUD
- Checkout preview
- Order create
- Library list
- Course player access + video module listesi

