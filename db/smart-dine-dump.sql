--
-- PostgreSQL database dump
--

\restrict GCvoIzSVNYbD4tweAIr8IpzXbuO6WlaIWLQcCqFd89xhzBYcyOgPkjVhUeVk5Ov

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: hrustinszkiadam
--

CREATE TYPE public.order_status AS ENUM (
    'placed',
    'completed'
);


ALTER TYPE public.order_status OWNER TO hrustinszkiadam;

--
-- Name: reservation_status; Type: TYPE; Schema: public; Owner: hrustinszkiadam
--

CREATE TYPE public.reservation_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);


ALTER TYPE public.reservation_status OWNER TO hrustinszkiadam;

--
-- Name: staff_role; Type: TYPE; Schema: public; Owner: hrustinszkiadam
--

CREATE TYPE public.staff_role AS ENUM (
    'owner',
    'employee'
);


ALTER TYPE public.staff_role OWNER TO hrustinszkiadam;

--
-- Name: table_shape; Type: TYPE; Schema: public; Owner: hrustinszkiadam
--

CREATE TYPE public.table_shape AS ENUM (
    'round',
    'rectangle'
);


ALTER TYPE public.table_shape OWNER TO hrustinszkiadam;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: hrustinszkiadam
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.user_role OWNER TO hrustinszkiadam;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.accounts OWNER TO hrustinszkiadam;

--
-- Name: menu_item_categories; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.menu_item_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.menu_item_categories OWNER TO hrustinszkiadam;

--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.menu_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price integer NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    image text
);


ALTER TABLE public.menu_items OWNER TO hrustinszkiadam;

--
-- Name: menu_items_to_categories; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.menu_items_to_categories (
    menu_item_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.menu_items_to_categories OWNER TO hrustinszkiadam;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    quantity integer NOT NULL,
    special_instructions text
);


ALTER TABLE public.order_items OWNER TO hrustinszkiadam;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_id uuid NOT NULL,
    operator_id text NOT NULL,
    status public.order_status DEFAULT 'placed'::public.order_status NOT NULL,
    total_amount integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


ALTER TABLE public.orders OWNER TO hrustinszkiadam;

--
-- Name: reservations; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_id uuid NOT NULL,
    customer_id text NOT NULL,
    reservation_time timestamp without time zone NOT NULL,
    reservation_end_time timestamp without time zone NOT NULL,
    party_size integer NOT NULL,
    status public.reservation_status DEFAULT 'pending'::public.reservation_status NOT NULL
);


ALTER TABLE public.reservations OWNER TO hrustinszkiadam;

--
-- Name: restaurant_tables; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.restaurant_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_number text NOT NULL,
    capacity integer NOT NULL,
    x_coordinate double precision NOT NULL,
    y_coordinate double precision NOT NULL,
    shape public.table_shape NOT NULL
);


ALTER TABLE public.restaurant_tables OWNER TO hrustinszkiadam;

--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.restaurants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    phone text NOT NULL,
    opening_hours jsonb NOT NULL,
    images text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.restaurants OWNER TO hrustinszkiadam;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL
);


ALTER TABLE public.sessions OWNER TO hrustinszkiadam;

--
-- Name: staff_roles; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.staff_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    restaurant_id uuid NOT NULL,
    role public.staff_role DEFAULT 'employee'::public.staff_role NOT NULL
);


ALTER TABLE public.staff_roles OWNER TO hrustinszkiadam;

--
-- Name: users; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO hrustinszkiadam;

--
-- Name: verifications; Type: TABLE; Schema: public; Owner: hrustinszkiadam
--

CREATE TABLE public.verifications (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.verifications OWNER TO hrustinszkiadam;

--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.accounts (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) FROM stdin;
lbpVEfpsseyNhlF6oIg2knf1fjE4CxvK        G09RC8d61Su2aQH2RF81zVpQzks6q84j        credential      G09RC8d61Su2aQH2RF81zVpQzks6q84j        \N      \N      \N      \N      \N      \N      b25bbbad90b5e83a6c415c4a98ac191b:2db718fcc4f5c7916d937f3f6713a758185cf3500f12d6be2dcc83cf727da66716092cfe266101af5647b30b1e1f5bb64d83ba8062e72773e2b6ea42d56b19e7       2026-04-21 18:28:32.257 2026-04-21 18:28:32.257
Rvt8zn2ZS4mwiRwNb4Mt5oAIawiLxrJW        f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        credential      f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        \N      \N      \N      \N      \N      \N      7deddae4b739ac83393f88affd07d050:60f8c9075a6963091ce29ce228244b0102e60ddf9f33887cf67f51503cf984cef0b656b1b3e541e21c22ec71372eb40dfb77e943efa65444e694d40e78869b64       2026-04-23 06:05:52.648 2026-04-23 06:05:52.648
qLNqPywBDPFM3UHQb9xWgFBIpW8vwJfr        77614023        github  G09RC8d61Su2aQH2RF81zVpQzks6q84j        \N      \N      \N      \N      \N      read:user,user:email    \N      2026-04-23 21:37:59.728 2026-04-23 21:37:59.728
xxxZeUJeRVjy8TtFUhrM0YYCO8nXZwM7        91804294        github  GzmKMl1D4KJqGkxv2kztIXbS8SsqGShd        \N      \N      \N      \N      \N      read:user,user:email    \N      2026-04-23 22:01:47.276 2026-04-23 22:03:31.349
L4rIEHERQgd3UXFy2RsY0lKoq4zda2zQ        114678176120912400583   google  G09RC8d61Su2aQH2RF81zVpQzks6q84j        \N      \N      \N      \N      \N      https://www.googleapis.com/auth/userinfo.profile,openid,https://www.googleapis.com/auth/userinfo.email   \N      2026-04-23 21:38:12.671 2026-04-24 17:05:39.398
\.


--
-- Data for Name: menu_item_categories; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.menu_item_categories (id, restaurant_id, name) FROM stdin;
bbc4a756-fdca-4b0f-99a0-c1476585ff1d    3294247a-01eb-4a53-8376-3e585f52021a    Starter
92b97bec-3884-4dce-b17b-57e417cbf902    3294247a-01eb-4a53-8376-3e585f52021a    Main Course
06b63339-1de9-4d00-bdbb-9556274937a4    3294247a-01eb-4a53-8376-3e585f52021a    Snack
cf34e2c4-0de6-4311-b47d-bd681ab93ea7    3294247a-01eb-4a53-8376-3e585f52021a    Dessert
d5c97938-ccc0-4c53-8472-b4f0815d43b9    3294247a-01eb-4a53-8376-3e585f52021a    Drink
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.menu_items (id, restaurant_id, name, description, price, is_available, image) FROM stdin;
ae541248-f8cd-4821-ab96-0c37b57ef7a9    3294247a-01eb-4a53-8376-3e585f52021a    Nashville Hot Pickles   Double-breaded spicy pickle chips with lime-creme fraiche.      785     t       \N
ec79059c-96ef-4011-8dd9-8ccd1da2b8a7    3294247a-01eb-4a53-8376-3e585f52021a    Whipped Schmaltz Toast  Sourdough with seasoned chicken fat, chives, and smoked sea salt.       675     t       \N
4e0ef696-46d9-47d8-9004-aa5b8fbc8e1a    3294247a-01eb-4a53-8376-3e585f52021a    The "Mother Clucker"    Buttermilk thigh, vinegar slaw, honey-mustard aioli, brioche bun.       1555    t       \N
e9c89dc9-0be7-402e-804b-71a11aa3802e    3294247a-01eb-4a53-8376-3e585f52021a    The Bird & The Iron     Buttermilk thigh, vinegar slaw, honey-mustard aioli, brioche bun.       1670    t       \N
976d0958-e3cc-4f20-8b32-3138ae95349a    3294247a-01eb-4a53-8376-3e585f52021a    Paprika-Infused Half Bird       24h brined half-chicken, traditional crust, cucumber salad.     2055    t       \N
0803cf32-b62f-4c68-8c96-a71ce31c7615    3294247a-01eb-4a53-8376-3e585f52021a    Crispy Skin Cracklings  Shattered-glass crisp chicken skins with salt-and-vinegar dust. 595     t       \N
59af958d-7daa-4358-96d3-c8ddbed65868    3294247a-01eb-4a53-8376-3e585f52021a    Popcorn Chick Bites     Pickle-juice marinated breast bites with house "Chick-Sauce."   945     t       \N
3212b13f-405a-4b10-9754-889351fdb7cf    3294247a-01eb-4a53-8376-3e585f52021a    Fried Honey-Butter Bun  Deep-fried donut bun, vanilla bean gelato, wildflower honey.    835     t       \N
8e5da55a-ab67-4566-80ad-66b951eff0f9    3294247a-01eb-4a53-8376-3e585f52021a    The Chocolate Egg       Molten dark chocolate egg on a spun-sugar nest. 915     t       \N
e7ff61e4-f0ff-4e7b-a4a2-011c103dfad9    3294247a-01eb-4a53-8376-3e585f52021a    The Ginger Hen  House ginger ale, mint, cold-pressed apple, elderflower.        465     t       \N
\.


--
-- Data for Name: menu_items_to_categories; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.menu_items_to_categories (menu_item_id, category_id) FROM stdin;
ae541248-f8cd-4821-ab96-0c37b57ef7a9    bbc4a756-fdca-4b0f-99a0-c1476585ff1d
ec79059c-96ef-4011-8dd9-8ccd1da2b8a7    bbc4a756-fdca-4b0f-99a0-c1476585ff1d
4e0ef696-46d9-47d8-9004-aa5b8fbc8e1a    92b97bec-3884-4dce-b17b-57e417cbf902
e9c89dc9-0be7-402e-804b-71a11aa3802e    92b97bec-3884-4dce-b17b-57e417cbf902
976d0958-e3cc-4f20-8b32-3138ae95349a    92b97bec-3884-4dce-b17b-57e417cbf902
0803cf32-b62f-4c68-8c96-a71ce31c7615    06b63339-1de9-4d00-bdbb-9556274937a4
59af958d-7daa-4358-96d3-c8ddbed65868    06b63339-1de9-4d00-bdbb-9556274937a4
3212b13f-405a-4b10-9754-889351fdb7cf    cf34e2c4-0de6-4311-b47d-bd681ab93ea7
8e5da55a-ab67-4566-80ad-66b951eff0f9    cf34e2c4-0de6-4311-b47d-bd681ab93ea7
e7ff61e4-f0ff-4e7b-a4a2-011c103dfad9    d5c97938-ccc0-4c53-8472-b4f0815d43b9
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.order_items (id, order_id, menu_item_id, quantity, special_instructions) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.orders (id, restaurant_id, table_id, operator_id, status, total_amount, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.reservations (id, restaurant_id, table_id, customer_id, reservation_time, reservation_end_time, party_size, status) FROM stdin;
922402db-f417-44cf-9918-a9ed1ec60f77    3294247a-01eb-4a53-8376-3e585f52021a    0f5868c9-7f8b-457b-a1ba-e09a5b6aaf8a   f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D 2026-04-23 09:00:00     2026-04-23 10:30:00     2       pending
05efb981-abcc-4b10-82a8-ad012a7af0cc    3294247a-01eb-4a53-8376-3e585f52021a    bb1a2590-5e80-4b6a-a8dc-252796e50b03   f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D 2026-04-29 10:00:00     2026-04-29 11:30:00     3       cancelled
3fbe12cc-a1f7-451e-b330-2826b3f78668    3294247a-01eb-4a53-8376-3e585f52021a    1443792f-78da-4934-9804-a1a2bf27745a   f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D 2026-04-25 11:00:00     2026-04-25 12:30:00     6       pending
da2fa97d-4d84-4f4e-90db-08c56c74e625    3294247a-01eb-4a53-8376-3e585f52021a    0f5868c9-7f8b-457b-a1ba-e09a5b6aaf8a   GzmKMl1D4KJqGkxv2kztIXbS8SsqGShd 2026-04-30 12:00:00     2026-04-30 13:30:00     2       confirmed
\.


--
-- Data for Name: restaurant_tables; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.restaurant_tables (id, restaurant_id, table_number, capacity, x_coordinate, y_coordinate, shape) FROM stdin;
8f1d54c8-e90a-4eaf-8c38-c85d1f52378a    3294247a-01eb-4a53-8376-3e585f52021a    T-1     4       0       0       round
0f5868c9-7f8b-457b-a1ba-e09a5b6aaf8a    3294247a-01eb-4a53-8376-3e585f52021a    T-2     2       1       0       rectangle
bb1a2590-5e80-4b6a-a8dc-252796e50b03    3294247a-01eb-4a53-8376-3e585f52021a    T-3     3       0       1       round
1443792f-78da-4934-9804-a1a2bf27745a    3294247a-01eb-4a53-8376-3e585f52021a    T-4     6       1       1       rectangle
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.restaurants (id, name, description, address, phone, opening_hours, images, created_at) FROM stdin;
3294247a-01eb-4a53-8376-3e585f52021a    Fried Chick     Only chicken and fries. 2117 Isazeg, Dózsa György út 100.      +36705332926     {"friday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}}    {}      2026-04-23 06:18:26.202681
85a1718c-2a31-42ed-a617-94ed570b4be1    Neon Paprika    Retro-futurist diner serving classic "Kádár-era" comfort food with a twist.     1085 Budapest, József krt. 45   +36 1 333 4444  {"friday": {"opens": "09:00", "closes": "00:00", "isClosed": false}, "monday": {"opens": "11:00", "closes": "23:00", "isClosed": true}, "sunday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "tuesday": {"opens": "11:00", "closes": "23:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "00:00", "isClosed": false}, "thursday": {"opens": "11:00", "closes": "23:00", "isClosed": false}, "wednesday": {"opens": "11:00", "closes": "23:00", "isClosed": false}}     {}      2026-04-24 17:37:47.300551
f6aafe13-fb41-4013-8517-5fedcaaffdd7    The Rusty Anchor        You can find the best crabby patties in here. Try it and find out what you've been missing.     8230 Balatonfüred, Zákonyi F. u. 4      +36 87 555 987  {"friday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "monday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "sunday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "tuesday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "saturday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "thursday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "wednesday": {"opens": "00:00", "closes": "23:59", "isClosed": false}}    {}      2026-04-24 17:37:53.396273
ed5ecf2c-a19a-44ae-a37f-f2597c52a751    The Silver Thimble      Small, intimate bistro located in a renovated 19th-century tailor shop. 9700 Szombathely, Fő tér 14     +36 94 500 110  {"friday": {"opens": "08:00", "closes": "20:00", "isClosed": false}, "monday": {"opens": "08:00", "closes": "20:00", "isClosed": false}, "sunday": {"opens": "08:00", "closes": "23:00", "isClosed": false}, "tuesday": {"opens": "08:00", "closes": "20:00", "isClosed": false}, "saturday": {"opens": "08:00", "closes": "23:00", "isClosed": false}, "thursday": {"opens": "08:00", "closes": "20:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": true}}     {}      2026-04-24 17:38:14.542843
bbf35f37-9136-4440-b398-6b64961abe88    Goulash Garden  If you want Goulash you won't find a better place.      1075 Budapest, Kazinczy u. 18   +36 30 123 4567 {"friday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}}    {}      2026-04-24 17:38:52.841028
f35aeead-5170-4bfa-aa29-d1ca4caefdc9    Cumania Grill   Open-fire BBQ spot featuring Mangalica pork and grilled seasonal vegetables.    5000 Szolnok, Tisza-parti sétány        +36 56 414 222  {"friday": {"opens": "11:00", "closes": "23:00", "isClosed": false}, "monday": {"opens": "11:00", "closes": "23:00", "isClosed": false}, "sunday": {"opens": "10:00", "closes": "23:00", "isClosed": false}, "tuesday": {"opens": "11:00", "closes": "23:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "00:00", "isClosed": false}, "thursday": {"opens": "11:00", "closes": "23:00", "isClosed": true}, "wednesday": {"opens": "11:00", "closes": "23:00", "isClosed": false}}     {}      2026-04-24 17:39:12.670078
da05a808-9d8e-493a-939b-21b5173a43a9    Pécs Pottery Cafe       Artistic cafe served in Zsolnay ceramics with a Mediterranean-style terrace.    7621 Pécs, Király u. 10 +36 72 312 999  {"friday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "22:00", "isClosed": true}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": true}}      {}      2026-04-24 17:39:29.080617
338a4b54-ad15-40c9-99cb-397ee8fb75df    Urban Orchard   Vegan-friendly brunch spot focusing on farm-to-table vegetable dishes.  1114 Budapest, Bartók Béla út 33        +36 70 987 6543 {"friday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "23:00", "isClosed": true}, "sunday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "23:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "23:00", "isClosed": false}}     {}      2026-04-24 17:39:48.628284
5fffe7fa-7d4e-4df1-b454-95a62b72c32b    Eger Vines Bistro       Boring day? Come and make it exceptional.       3300 Eger, Szépasszony-völgy 15 +36 36 789 000  {"friday": {"opens": "06:00", "closes": "00:00", "isClosed": false}, "monday": {"opens": "06:00", "closes": "20:00", "isClosed": false}, "sunday": {"opens": "06:00", "closes": "23:00", "isClosed": false}, "tuesday": {"opens": "06:00", "closes": "20:00", "isClosed": false}, "saturday": {"opens": "06:00", "closes": "00:00", "isClosed": false}, "thursday": {"opens": "06:00", "closes": "20:00", "isClosed": false}, "wednesday": {"opens": "06:00", "closes": "20:00", "isClosed": false}}    {}      2026-04-24 17:40:29.005488
a3a1d938-6247-4543-a36e-198321ea6b7d    Wild Boar Lodge Hunting-lodge themed restaurant specializing in forest mushrooms and venison.   8000 Székesfehérvár, Fő utca 1  +36 22 501 202  {"friday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "22:00", "isClosed": true}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "22:00", "isClosed": true}, "saturday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}}      {}      2026-04-24 17:40:50.984949
ff7762b9-56d8-4d23-849e-4cfaa50b9833    Blue Danube Deli        Quaint riverside cafe serving artisanal Marzipan treats and lavender lemonades. 2000 Szentendre, Bogdányi u. 2  +36 26 310 555  {"friday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "saturday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "wednesday": {"opens": "09:00", "closes": "22:00", "isClosed": false}}    {}      2026-04-24 17:41:30.465271
79e27365-11fc-4e7d-bdd6-b499f629a204    The Salted Pretzel      Traditional bakery and bistro known for spicy fish soup and fresh pastries.     6720 Szeged, Széchenyi tér 5    +36 62 420 777  {"friday": {"opens": "08:00", "closes": "23:00", "isClosed": false}, "monday": {"opens": "10:00", "closes": "23:00", "isClosed": false}, "sunday": {"opens": "09:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "10:00", "closes": "23:00", "isClosed": false}, "saturday": {"opens": "08:00", "closes": "23:00", "isClosed": false}, "thursday": {"opens": "10:00", "closes": "23:00", "isClosed": false}, "wednesday": {"opens": "10:00", "closes": "23:00", "isClosed": false}}    {}      2026-04-24 17:41:16.932888
bbae3969-9a83-4ac1-b3d8-8c971802c86a    Saffron & Silk  Fusion restaurant blending Silk Road spices with traditional Hungarian ingredients.     1061 Budapest, Andrássy út 20   +36 1 269 8888  {"friday": {"opens": "08:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "08:00", "closes": "22:00", "isClosed": false}, "sunday": {"opens": "08:00", "closes": "22:00", "isClosed": false}, "tuesday": {"opens": "08:00", "closes": "22:00", "isClosed": false}, "saturday": {"opens": "08:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "08:00", "closes": "22:00", "isClosed": true}, "wednesday": {"opens": "08:00", "closes": "22:00", "isClosed": false}}     {}      2026-04-24 17:41:34.389091
9c0fd4ff-a3a2-4903-adea-59d077e660f8    Iron Rooster    Hearty Northern-Hungarian pub food with a modern craft beer selection.  9021 Győr, Városház tér 3       +36 96 321 654  {"friday": {"opens": "10:00", "closes": "22:00", "isClosed": false}, "monday": {"opens": "12:00", "closes": "18:00", "isClosed": false}, "sunday": {"opens": "12:00", "closes": "19:00", "isClosed": false}, "tuesday": {"opens": "12:00", "closes": "18:00", "isClosed": false}, "saturday": {"opens": "10:00", "closes": "22:00", "isClosed": false}, "thursday": {"opens": "12:00", "closes": "18:00", "isClosed": false}, "wednesday": {"opens": "12:00", "closes": "18:00", "isClosed": false}}    {}      2026-04-24 17:43:19.088875
04babd7e-c2cd-434a-aa39-12ba139ccee8    Bob's Pizzeria  The best authentic pizza experience in town. You should definitely give it a shot.      1052 Budapest, Váci u. 12       +36 1 483 1234  {"friday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "monday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "sunday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "tuesday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "saturday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "thursday": {"opens": "00:00", "closes": "23:59", "isClosed": false}, "wednesday": {"opens": "00:00", "closes": "23:59", "isClosed": false}}    {}      2026-04-24 17:44:56.098404
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.sessions (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) FROM stdin;
ZpDjiKAvgQN8F5F4taCEHHIWMpdb0F4a        2026-04-30 06:25:30.315 ehDTmfwqeQMZvC2UGui03TJF3ZNPUIHB        2026-04-23 06:25:30.315 2026-04-23 06:25:30.315 172.69.151.15   Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0   f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D
OKlIaEes5TRqsMiP5GRcdUSGSwVTukoC        2026-04-30 06:27:47.387 lfe4GW3VNG8dL1rUHunAQIUyFuP1WjZ2        2026-04-23 06:27:47.387 2026-04-23 06:27:47.387 172.71.144.6    Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1 f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D
BcnzUq9gkmKhjo53M88jtWji3cJuWSrG        2026-04-30 19:12:09.568 mdIPTXlgBjNnqMQeBJc0tNNXzBDUwdgP        2026-04-23 19:12:09.568 2026-04-23 19:12:09.568 172.70.240.190  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D
xL1kRgsG0Ybv6xSC5rg69QktAEORvZSV        2026-04-30 22:03:31.354 wlPOrcUwCVZNvMWe0UEmJb90ej6u4QZl        2026-04-23 22:03:31.354 2026-04-23 22:03:31.354 172.71.172.221  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 OPR/130.0.0.0   GzmKMl1D4KJqGkxv2kztIXbS8SsqGShd
mU26LzwAN8wQdV6e2oxbU5svyy4ZMdQW        2026-05-01 15:09:08.292 c3nvVVxUQsDIUiyMzFtC2md8pdvKDLAy        2026-04-24 15:09:08.292 2026-04-24 15:09:08.292 172.71.144.6    Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 OPR/130.0.0.0   G09RC8d61Su2aQH2RF81zVpQzks6q84j
bK9hnUW40WFtqlKals022QofpAZV6Dhe        2026-05-01 17:05:39.405 h9qz4XCYiS4ez0O5nHbNkmkGLOGYpscd        2026-04-24 17:05:39.405 2026-04-24 17:05:39.405 172.70.248.130  Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Mobile/15E148 Safari/604.1 G09RC8d61Su2aQH2RF81zVpQzks6q84j
1ESrDfAd1GzzDXsSDRNuuFE2xGlyF3KR        2026-05-01 17:26:27.508 aRMqZpXc641Vta5upIGKvO5kh5vAqmzw        2026-04-24 17:26:27.509 2026-04-24 17:26:27.509 172.70.240.191  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D
Fl5b99mr21XY1RN8cj7fsgml7dQxVb2A        2026-05-01 17:36:25.047 kWw3GQK6YHeKMtG9aW2P47MYV95ZxzMC        2026-04-24 17:36:25.047 2026-04-24 17:36:25.047 162.158.95.157  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D
\.


--
-- Data for Name: staff_roles; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.staff_roles (id, user_id, restaurant_id, role) FROM stdin;
7ae3201b-47a0-45b7-a11d-c59de94791be    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        3294247a-01eb-4a53-8376-3e585f52021a   owner
680ff84c-842b-4683-8607-0664269eb4c8    G09RC8d61Su2aQH2RF81zVpQzks6q84j        3294247a-01eb-4a53-8376-3e585f52021a   employee
c6111b97-5f68-4511-977f-bdb847e46989    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        85a1718c-2a31-42ed-a617-94ed570b4be1   owner
c12daba6-ad6d-49d0-a1eb-d90978b05398    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        f6aafe13-fb41-4013-8517-5fedcaaffdd7   owner
16627827-324a-492b-9602-3857c56fc916    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        ed5ecf2c-a19a-44ae-a37f-f2597c52a751   owner
724dba2e-0ad8-40b9-aa06-943502b73eb7    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        bbf35f37-9136-4440-b398-6b64961abe88   owner
663e11f9-5800-49a1-a715-28e485c37fde    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        f35aeead-5170-4bfa-aa29-d1ca4caefdc9   owner
bf37adfc-d272-4578-9bd6-f4822f1ea638    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        da05a808-9d8e-493a-939b-21b5173a43a9   owner
28c50350-5793-41d3-a389-f9fd1cab9006    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        338a4b54-ad15-40c9-99cb-397ee8fb75df   owner
c90e88c7-0818-49b2-b64d-2aa4f3f7bae8    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        5fffe7fa-7d4e-4df1-b454-95a62b72c32b   owner
939c1f3c-beae-4aca-be68-e49371252c7e    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        a3a1d938-6247-4543-a36e-198321ea6b7d   owner
56f98fb5-cd1d-4ad2-b059-93d940a47b78    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        79e27365-11fc-4e7d-bdd6-b499f629a204   owner
8506054c-7f30-4363-9949-6304e7b00be0    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        ff7762b9-56d8-4d23-849e-4cfaa50b9833   owner
e6230243-92d6-4ff8-9246-36fe0a19769f    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        bbae3969-9a83-4ac1-b3d8-8c971802c86a   owner
c162ed7f-3ee1-413f-be61-74d05fccad59    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        9c0fd4ff-a3a2-4903-adea-59d077e660f8   owner
07f623be-0704-4b0a-ab6d-ff76f57049a8    f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        04babd7e-c2cd-434a-aa39-12ba139ccee8   owner
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.users (id, name, email, email_verified, image, role, created_at, updated_at) FROM stdin;
f9NuHBgW8Zgu2HWrO4EMLUm7lfJPxq8D        Test User       test@hrustinszki.com    f       \N      admin   2026-04-23 06:05:52.642 2026-04-23 06:05:52.642
G09RC8d61Su2aQH2RF81zVpQzks6q84j        Hrustinszki Ádám        hrustinszkiadam@gmail.com       t       \N      user   2026-04-21 18:28:32.251  2026-04-23 21:37:59.735
GzmKMl1D4KJqGkxv2kztIXbS8SsqGShd        Márk Derkovics  derko.jr@gmail.com      t       https://avatars.githubusercontent.com/u/91804294?v=4    user    2026-04-23 22:01:47.272 2026-04-23 22:01:47.272
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: hrustinszkiadam
--

COPY public.verifications (id, identifier, value, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: menu_item_categories menu_item_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_item_categories
    ADD CONSTRAINT menu_item_categories_pkey PRIMARY KEY (id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);


--
-- Name: menu_items_to_categories menu_items_to_categories_menu_item_id_category_id_pk; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_items_to_categories
    ADD CONSTRAINT menu_items_to_categories_menu_item_id_category_id_pk PRIMARY KEY (menu_item_id, category_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: restaurant_tables restaurant_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);


--
-- Name: staff_roles staff_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: accounts_userId_idx; Type: INDEX; Schema: public; Owner: hrustinszkiadam
--

CREATE INDEX "accounts_userId_idx" ON public.accounts USING btree (user_id);


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: hrustinszkiadam
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree (user_id);


--
-- Name: verifications_identifier_idx; Type: INDEX; Schema: public; Owner: hrustinszkiadam
--

CREATE INDEX verifications_identifier_idx ON public.verifications USING btree (identifier);


--
-- Name: accounts accounts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: menu_item_categories menu_item_categories_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_item_categories
    ADD CONSTRAINT menu_item_categories_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: menu_items menu_items_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: menu_items_to_categories menu_items_to_categories_category_id_menu_item_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_items_to_categories
    ADD CONSTRAINT menu_items_to_categories_category_id_menu_item_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.menu_item_categories(id) ON DELETE CASCADE;


--
-- Name: menu_items_to_categories menu_items_to_categories_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.menu_items_to_categories
    ADD CONSTRAINT menu_items_to_categories_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_menu_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_operator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_operator_id_users_id_fk FOREIGN KEY (operator_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: orders orders_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: orders orders_table_id_restaurant_tables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_restaurant_tables_id_fk FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE RESTRICT;


--
-- Name: reservations reservations_customer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: reservations reservations_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: reservations reservations_table_id_restaurant_tables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_table_id_restaurant_tables_id_fk FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id) ON DELETE RESTRICT;


--
-- Name: restaurant_tables restaurant_tables_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.restaurant_tables
    ADD CONSTRAINT restaurant_tables_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: staff_roles staff_roles_restaurant_id_restaurants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_restaurant_id_restaurants_id_fk FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: staff_roles staff_roles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: hrustinszkiadam
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GCvoIzSVNYbD4tweAIr8IpzXbuO6WlaIWLQcCqFd89xhzBYcyOgPkjVhUeVk5Ov
