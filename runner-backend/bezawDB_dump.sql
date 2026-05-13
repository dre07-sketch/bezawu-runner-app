--
-- PostgreSQL database dump
--

\restrict EfnNPxb6ZMH5AHDa5NCAijBJnFhwU59PNZXD4gqxdaNrEDnpdpF9keFEckCMmCv

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supermarket_id uuid,
    bank_name character varying(100) NOT NULL,
    account_name character varying(255) NOT NULL,
    account_number character varying(100) NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- Name: branch_inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_inventory (
    branch_id uuid NOT NULL,
    product_id uuid NOT NULL,
    stock_level integer DEFAULT 0
);


ALTER TABLE public.branch_inventory OWNER TO postgres;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supermarket_id uuid,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    map_pin text,
    phone character varying(50),
    is_busy boolean DEFAULT false,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    product_id uuid,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    supermarket_id uuid,
    name character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255),
    password_hash text,
    fcm_token text,
    default_car_plate character varying(50),
    default_car_model character varying(100),
    default_car_color character varying(50),
    is_verified boolean DEFAULT false,
    profile_picture text,
    language_pref character varying(5) DEFAULT 'en'::character varying,
    default_car_year integer,
    default_car_image text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    rating integer,
    comment text,
    sentiment character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: managers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.managers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'BRANCH_MANAGER'::character varying,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    otp_code character varying(6),
    otp_expires_at timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.managers OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    price_at_purchase numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid,
    customer_id uuid,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    total_price numeric(12,2),
    car_model character varying(100),
    car_plate character varying(50),
    car_color character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    pickup_code character varying(10),
    payment_method character varying(50) DEFAULT 'CASH'::character varying,
    payment_status character varying(50) DEFAULT 'PENDING'::character varying
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    name character varying(255) NOT NULL,
    price numeric(12,2) NOT NULL,
    image_url text,
    sku character varying(50),
    description text,
    is_fasting boolean DEFAULT false,
    unit character varying(50) DEFAULT 'pc'::character varying,
    discount_price numeric(12,2)
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: supermarkets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supermarkets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    logo text,
    vat_cert text,
    business_license text,
    tin character varying(50) NOT NULL,
    email character varying(255),
    phone character varying(50),
    website character varying(255),
    reg_code character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supermarkets OWNER TO postgres;

--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_accounts (id, supermarket_id, bank_name, account_name, account_number, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: branch_inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_inventory (branch_id, product_id, stock_level) FROM stdin;
05485ed0-b2c6-4183-b1c8-b644e8af8f5b	6c173ca9-ef52-443d-8619-0e7c2cb63a5c	100
05485ed0-b2c6-4183-b1c8-b644e8af8f5b	47c64ebc-c26f-48f8-88e9-ba6ee945782c	100
05485ed0-b2c6-4183-b1c8-b644e8af8f5b	35e9228c-6583-4ff7-a0a4-f8cb1e80a6b7	100
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, supermarket_id, name, address, map_pin, phone, is_busy, status, created_at, updated_at) FROM stdin;
05485ed0-b2c6-4183-b1c8-b644e8af8f5b	6b5af95f-7008-48f6-bef7-405a59c28cfc	Bole Branch	Bole Road, Addis Ababa	\N	0911000000	f	ACTIVE	2025-12-30 18:33:19.768072+03	2025-12-30 18:33:19.768072+03
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, customer_id, product_id, quantity, created_at) FROM stdin;
9909d920-90bd-419c-8701-e6d6b2e51bca	d7d6ffd8-f4c7-4f8f-8067-d3c15305d16e	35e9228c-6583-4ff7-a0a4-f8cb1e80a6b7	2	2025-12-30 18:34:37.733472+03
4527c0ad-3874-4707-8d4f-8910d0babf3d	d7d6ffd8-f4c7-4f8f-8067-d3c15305d16e	6c173ca9-ef52-443d-8619-0e7c2cb63a5c	3	2025-12-30 18:34:33.786645+03
0cb6f0bb-9164-443a-a1fb-28172a503550	d7d6ffd8-f4c7-4f8f-8067-d3c15305d16e	47c64ebc-c26f-48f8-88e9-ba6ee945782c	4	2025-12-30 18:34:34.638022+03
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, supermarket_id, name) FROM stdin;
7b674ff6-8151-413f-8338-a5d529a84ed0	6b5af95f-7008-48f6-bef7-405a59c28cfc	Grains
5e0c1c50-4b4a-4ba2-aa78-3324f9a4dd68	6b5af95f-7008-48f6-bef7-405a59c28cfc	Beverages
63bd5dca-a463-453e-879a-3e916bc7ed14	6b5af95f-7008-48f6-bef7-405a59c28cfc	Vegetables
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, email, password_hash, fcm_token, default_car_plate, default_car_model, default_car_color, is_verified, profile_picture, language_pref, default_car_year, default_car_image, updated_at) FROM stdin;
d7d6ffd8-f4c7-4f8f-8067-d3c15305d16e	Abebe Bikila	0911223344	abebe@example.com	$2b$10$7UrxvEQdb9b5o6FjAWk62uSEgGNvY9cO4xShut/PpWcoY5ecReGXW	\N	\N	\N	\N	f	\N	en	\N	\N	2025-12-30 18:33:19.768072
c30d1ec0-7479-4bda-bdb2-3fd0c2b2e1f6	Dawit B/Meskel	0912345678	\N	$2b$10$Da157PuVxge4t1.KfVW2ZeZCXpl3KEqd6qKaZkCyF/7Yoy.WhI7Cm	\N	A-43535	\N	\N	f	\N	en	\N	\N	2025-12-30 18:40:01.857412
241fabec-530b-4146-a061-90a171517823	kaleab	0942141197	\N	$2b$10$cU3lC.mNBLrgpWNpdx6oweHE5c2WWUba65IjrlUd.k/LOVQkorE8.	\N	A-12334	\N	\N	f	\N	en	\N	\N	2025-12-30 19:33:57.049293
a6e5c6d5-c8f7-4620-a92a-14930c206763	dawa dawa	0945454545	\N	$2b$10$UcZPFMEn/ziNYnqBykfU4eWQfgTvH40hPc9jQkkcXIE8FtQQ.GSDK	\N		\N	\N	f	\N	en	\N	\N	2025-12-30 19:42:44.864178
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, order_id, rating, comment, sentiment, created_at) FROM stdin;
\.


--
-- Data for Name: managers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.managers (id, branch_id, name, email, phone, password_hash, role, status, otp_code, otp_expires_at, last_login, created_at) FROM stdin;
8b07ce40-af42-4d6c-9ab1-15516311035f	05485ed0-b2c6-4183-b1c8-b644e8af8f5b	Kebede Manager	manager@shoa.com	\N	$2b$10$7UrxvEQdb9b5o6FjAWk62uSEgGNvY9cO4xShut/PpWcoY5ecReGXW	BRANCH_MANAGER	ACTIVE	\N	\N	\N	2025-12-30 18:33:19.768072+03
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, price_at_purchase, created_at) FROM stdin;
29f60dca-91fe-4a4f-9f92-8b4e1de76d0b	de319286-5765-4af7-a455-208e12f44988	6c173ca9-ef52-443d-8619-0e7c2cb63a5c	3	450.00	2025-12-30 19:08:26.951277+03
9e217cab-450b-453f-b87b-1fcbe463516f	de319286-5765-4af7-a455-208e12f44988	47c64ebc-c26f-48f8-88e9-ba6ee945782c	3	350.00	2025-12-30 19:08:26.951277+03
0c81856b-edbc-452a-9ec4-342f88085def	de319286-5765-4af7-a455-208e12f44988	35e9228c-6583-4ff7-a0a4-f8cb1e80a6b7	3	60.00	2025-12-30 19:08:26.951277+03
1e91a2ad-286f-4ae3-b9a9-39b0b03fac6c	5b9a8b72-8dc8-4a4e-9c37-04bd21c703b5	47c64ebc-c26f-48f8-88e9-ba6ee945782c	1	350.00	2025-12-30 19:24:02.774995+03
efbc5309-ea42-4f9d-b956-1e9a0ba279f9	5b9a8b72-8dc8-4a4e-9c37-04bd21c703b5	35e9228c-6583-4ff7-a0a4-f8cb1e80a6b7	1	60.00	2025-12-30 19:24:02.774995+03
d32b3b97-dba3-4fd0-856b-546951a53509	145a66c9-736a-4e00-9c5c-abfb4c47d51b	6c173ca9-ef52-443d-8619-0e7c2cb63a5c	1	450.00	2025-12-30 19:34:41.371787+03
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, branch_id, customer_id, status, total_price, car_model, car_plate, car_color, created_at, pickup_code, payment_method, payment_status) FROM stdin;
de319286-5765-4af7-a455-208e12f44988	05485ed0-b2c6-4183-b1c8-b644e8af8f5b	c30d1ec0-7479-4bda-bdb2-3fd0c2b2e1f6	PENDING	2580.00	Toyota	A-43535	Red	2025-12-30 19:08:26.951277+03	\N	CASH	PENDING
5b9a8b72-8dc8-4a4e-9c37-04bd21c703b5	05485ed0-b2c6-4183-b1c8-b644e8af8f5b	c30d1ec0-7479-4bda-bdb2-3fd0c2b2e1f6	PENDING	410.00	Toyota	A-43535	Red	2025-12-30 19:24:02.774995+03	\N	CASH	PENDING
145a66c9-736a-4e00-9c5c-abfb4c47d51b	05485ed0-b2c6-4183-b1c8-b644e8af8f5b	241fabec-530b-4146-a061-90a171517823	PENDING	450.00	Toyota	A-12334	Red	2025-12-30 19:34:41.371787+03	\N	CASH	PENDING
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, category_id, name, price, image_url, sku, description, is_fasting, unit, discount_price) FROM stdin;
6c173ca9-ef52-443d-8619-0e7c2cb63a5c	7b674ff6-8151-413f-8338-a5d529a84ed0	Teff Flour (5kg)	450.00	https://picsum.photos/id/42/300/300	\N	\N	f	pc	\N
47c64ebc-c26f-48f8-88e9-ba6ee945782c	5e0c1c50-4b4a-4ba2-aa78-3324f9a4dd68	Ethiopian Coffee Beans (1kg)	350.00	https://picsum.photos/id/43/300/300	\N	\N	f	pc	\N
35e9228c-6583-4ff7-a0a4-f8cb1e80a6b7	63bd5dca-a463-453e-879a-3e916bc7ed14	Red Onions (1kg)	60.00	https://picsum.photos/id/45/300/300	\N	\N	f	pc	\N
\.


--
-- Data for Name: supermarkets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supermarkets (id, name, logo, vat_cert, business_license, tin, email, phone, website, reg_code, created_at, updated_at) FROM stdin;
6b5af95f-7008-48f6-bef7-405a59c28cfc	Shoa Supermarket	\N	\N	\N	TIN001	shoa@example.com	\N	\N	REG001	2025-12-30 18:33:19.768072+03	2025-12-30 18:33:19.768072+03
\.


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: branch_inventory branch_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_pkey PRIMARY KEY (branch_id, product_id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_customer_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_customer_id_product_id_key UNIQUE (customer_id, product_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: managers managers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_email_key UNIQUE (email);


--
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: supermarkets supermarkets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supermarkets
    ADD CONSTRAINT supermarkets_pkey PRIMARY KEY (id);


--
-- Name: supermarkets supermarkets_reg_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supermarkets
    ADD CONSTRAINT supermarkets_reg_code_key UNIQUE (reg_code);


--
-- Name: supermarkets supermarkets_tin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supermarkets
    ADD CONSTRAINT supermarkets_tin_key UNIQUE (tin);


--
-- Name: bank_accounts bank_accounts_supermarket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_supermarket_id_fkey FOREIGN KEY (supermarket_id) REFERENCES public.supermarkets(id) ON DELETE CASCADE;


--
-- Name: branch_inventory branch_inventory_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_inventory branch_inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_inventory
    ADD CONSTRAINT branch_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: branches branches_supermarket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_supermarket_id_fkey FOREIGN KEY (supermarket_id) REFERENCES public.supermarkets(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: categories categories_supermarket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_supermarket_id_fkey FOREIGN KEY (supermarket_id) REFERENCES public.supermarkets(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: managers managers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EfnNPxb6ZMH5AHDa5NCAijBJnFhwU59PNZXD4gqxdaNrEDnpdpF9keFEckCMmCv

