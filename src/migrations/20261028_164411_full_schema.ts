import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The first demo had a different, much smaller schema. Clear it out before building the full one.
  // On a brand-new database this finds nothing to drop.
  await db.execute(sql`DO $$ DECLARE r record; BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
      EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    FOR r IN SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e' LOOP
      EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
  END $$;`)

  await db.execute(sql`
   CREATE TYPE "public"."enum_companies_tier" AS ENUM('standard', 'claimed', 'partner');
  CREATE TYPE "public"."enum_companies_rating_state" AS ENUM('not_rated', 'under_review', 'rated', 'suspended');
  CREATE TYPE "public"."enum_companies_confidence" AS ENUM('High', 'Medium', 'Low');
  CREATE TYPE "public"."enum__companies_v_version_tier" AS ENUM('standard', 'claimed', 'partner');
  CREATE TYPE "public"."enum__companies_v_version_rating_state" AS ENUM('not_rated', 'under_review', 'rated', 'suspended');
  CREATE TYPE "public"."enum__companies_v_version_confidence" AS ENUM('High', 'Medium', 'Low');
  CREATE TYPE "public"."enum_licences_status" AS ENUM('Active', 'Suspended', 'Withdrawn', 'Unknown');
  CREATE TYPE "public"."enum_ratings_status" AS ENUM('draft', 'in_review', 'published');
  CREATE TYPE "public"."enum_ratings_state" AS ENUM('not_rated', 'under_review', 'rated', 'suspended');
  CREATE TYPE "public"."enum__ratings_v_version_status" AS ENUM('draft', 'in_review', 'published');
  CREATE TYPE "public"."enum__ratings_v_version_state" AS ENUM('not_rated', 'under_review', 'rated', 'suspended');
  CREATE TYPE "public"."enum_reviews_relationship" AS ENUM('client', 'ex_client', 'partner');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_reviews_reply_status" AS ENUM('none', 'pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_claims_status" AS ENUM('new', 'in_progress', 'approved', 'rejected', 'done');
  CREATE TYPE "public"."enum_edit_requests_status" AS ENUM('new', 'in_progress', 'approved', 'rejected', 'done');
  CREATE TYPE "public"."enum_reports_kind" AS ENUM('data_error', 'rating_review', 'review_abuse');
  CREATE TYPE "public"."enum_reports_status" AS ENUM('new', 'in_progress', 'approved', 'rejected', 'done');
  CREATE TYPE "public"."enum_leads_type" AS ENUM('callback', 'contact', 'business');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'in_progress', 'approved', 'rejected', 'done');
  CREATE TYPE "public"."enum_featured_slots_placement" AS ENUM('home', 'search', 'category', 'similar');
  CREATE TYPE "public"."enum_alerts_kind" AS ENUM('regulator', 'notice');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'analyst', 'editor', 'moderator', 'sales', 'business', 'member');
  CREATE TABLE "companies_brand_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "companies_former_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "companies_operating_countries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL
  );
  
  CREATE TABLE "companies_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"photo_url" varchar,
  	"bio" varchar
  );
  
  CREATE TABLE "companies_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"city" varchar NOT NULL,
  	"country" varchar,
  	"address" varchar,
  	"lat" numeric,
  	"lng" numeric
  );
  
  CREATE TABLE "companies_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone,
  	"summary" varchar
  );
  
  CREATE TABLE "companies_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "companies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"entity_id" varchar,
  	"primary_category_id" integer,
  	"hq_country" varchar,
  	"website" varchar,
  	"group_id" varchar,
  	"short_description" varchar,
  	"lei" varchar,
  	"year_founded" numeric,
  	"employee_range" varchar,
  	"min_deposit_usd" numeric,
  	"registered_address" varchar,
  	"office_locations" varchar,
  	"key_people" varchar,
  	"products_services" varchar,
  	"platforms" varchar,
  	"client_types" varchar,
  	"languages" varchar,
  	"arabic_website" boolean,
  	"public_email" varchar,
  	"phone" varchar,
  	"social_links" varchar,
  	"tier" "enum_companies_tier" DEFAULT 'standard' NOT NULL,
  	"tier_start" timestamp(3) with time zone,
  	"tier_end" timestamp(3) with time zone,
  	"logo_url" varchar,
  	"banner_url" varchar,
  	"extended_about" varchar,
  	"video_url" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"accounts" varchar,
  	"instruments" varchar,
  	"platforms_detail" varchar,
  	"fees" varchar,
  	"rating_state" "enum_companies_rating_state" DEFAULT 'not_rated',
  	"rating_overall" numeric,
  	"rating_band" varchar,
  	"rating_color" varchar,
  	"rating_date" timestamp(3) with time zone,
  	"rating_note" varchar,
  	"rating_methodology" varchar,
  	"rating_scores" jsonb,
  	"review_count" numeric DEFAULT 0,
  	"review_average" numeric,
  	"alert_active" boolean,
  	"priority" numeric,
  	"confidence" "enum_companies_confidence",
  	"warning_flag" boolean,
  	"date_verified" timestamp(3) with time zone,
  	"listed_on" varchar,
  	"sources" varchar,
  	"notes" varchar,
  	"is_example" boolean,
  	"archived" boolean,
  	"edited_since_import" boolean,
  	"last_imported_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "companies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_companies_v_version_brand_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_former_names" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_operating_countries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"photo_url" varchar,
  	"bio" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar NOT NULL,
  	"country" varchar,
  	"address" varchar,
  	"lat" numeric,
  	"lng" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone,
  	"summary" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v_version_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_companies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_legal_name" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_entity_id" varchar,
  	"version_primary_category_id" integer,
  	"version_hq_country" varchar,
  	"version_website" varchar,
  	"version_group_id" varchar,
  	"version_short_description" varchar,
  	"version_lei" varchar,
  	"version_year_founded" numeric,
  	"version_employee_range" varchar,
  	"version_min_deposit_usd" numeric,
  	"version_registered_address" varchar,
  	"version_office_locations" varchar,
  	"version_key_people" varchar,
  	"version_products_services" varchar,
  	"version_platforms" varchar,
  	"version_client_types" varchar,
  	"version_languages" varchar,
  	"version_arabic_website" boolean,
  	"version_public_email" varchar,
  	"version_phone" varchar,
  	"version_social_links" varchar,
  	"version_tier" "enum__companies_v_version_tier" DEFAULT 'standard' NOT NULL,
  	"version_tier_start" timestamp(3) with time zone,
  	"version_tier_end" timestamp(3) with time zone,
  	"version_logo_url" varchar,
  	"version_banner_url" varchar,
  	"version_extended_about" varchar,
  	"version_video_url" varchar,
  	"version_cta_label" varchar,
  	"version_cta_url" varchar,
  	"version_accounts" varchar,
  	"version_instruments" varchar,
  	"version_platforms_detail" varchar,
  	"version_fees" varchar,
  	"version_rating_state" "enum__companies_v_version_rating_state" DEFAULT 'not_rated',
  	"version_rating_overall" numeric,
  	"version_rating_band" varchar,
  	"version_rating_color" varchar,
  	"version_rating_date" timestamp(3) with time zone,
  	"version_rating_note" varchar,
  	"version_rating_methodology" varchar,
  	"version_rating_scores" jsonb,
  	"version_review_count" numeric DEFAULT 0,
  	"version_review_average" numeric,
  	"version_alert_active" boolean,
  	"version_priority" numeric,
  	"version_confidence" "enum__companies_v_version_confidence",
  	"version_warning_flag" boolean,
  	"version_date_verified" timestamp(3) with time zone,
  	"version_listed_on" varchar,
  	"version_sources" varchar,
  	"version_notes" varchar,
  	"version_is_example" boolean,
  	"version_archived" boolean,
  	"version_edited_since_import" boolean,
  	"version_last_imported_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_companies_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "licences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_id" integer NOT NULL,
  	"regulator_id" integer NOT NULL,
  	"licence_number" varchar NOT NULL,
  	"jurisdiction" varchar,
  	"status" "enum_licences_status" DEFAULT 'Active',
  	"licence_type" varchar,
  	"date_granted" timestamp(3) with time zone,
  	"date_checked" timestamp(3) with time zone,
  	"register_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric DEFAULT 100,
  	"parent_id" integer,
  	"intro" varchar,
  	"later_phase" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "regulators" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"country" varchar,
  	"order" numeric DEFAULT 100,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"register_url" varchar,
  	"alerts_url" varchar,
  	"register_last_checked" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ratings_scores" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"criterion" varchar NOT NULL,
  	"max" numeric NOT NULL,
  	"score" numeric,
  	"internal_note" varchar,
  	"shareable_note" varchar
  );
  
  CREATE TABLE "ratings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"company_id" integer NOT NULL,
  	"methodology_id" integer NOT NULL,
  	"status" "enum_ratings_status" DEFAULT 'draft' NOT NULL,
  	"state" "enum_ratings_state" DEFAULT 'rated' NOT NULL,
  	"overall" numeric,
  	"band" varchar,
  	"band_color" varchar,
  	"methodology_version" varchar,
  	"reason" varchar NOT NULL,
  	"public_note" varchar,
  	"analyst_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_ratings_v_version_scores" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"criterion" varchar NOT NULL,
  	"max" numeric NOT NULL,
  	"score" numeric,
  	"internal_note" varchar,
  	"shareable_note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ratings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_company_id" integer NOT NULL,
  	"version_methodology_id" integer NOT NULL,
  	"version_status" "enum__ratings_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_state" "enum__ratings_v_version_state" DEFAULT 'rated' NOT NULL,
  	"version_overall" numeric,
  	"version_band" varchar,
  	"version_band_color" varchar,
  	"version_methodology_version" varchar,
  	"version_reason" varchar NOT NULL,
  	"version_public_note" varchar,
  	"version_analyst_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "methodologies_criteria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"max_points" numeric NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "methodologies_bands" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"min_score" numeric NOT NULL,
  	"color" varchar NOT NULL
  );
  
  CREATE TABLE "methodologies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"version" varchar NOT NULL,
  	"is_default" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "methodologies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_id" integer NOT NULL,
  	"author_id" integer,
  	"author_name" varchar,
  	"rating" numeric NOT NULL,
  	"experience_date" timestamp(3) with time zone,
  	"relationship" "enum_reviews_relationship",
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"proof_note" varchar,
  	"status" "enum_reviews_status" DEFAULT 'pending' NOT NULL,
  	"verified" boolean,
  	"auto_flag" varchar,
  	"helpful_count" numeric DEFAULT 0,
  	"report_count" numeric DEFAULT 0,
  	"reply_text" varchar,
  	"reply_status" "enum_reviews_reply_status" DEFAULT 'none',
  	"reply_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "claims" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_id" integer NOT NULL,
  	"user_id" integer,
  	"name" varchar NOT NULL,
  	"job_title" varchar,
  	"work_email" varchar NOT NULL,
  	"message" varchar,
  	"status" "enum_claims_status" DEFAULT 'new' NOT NULL,
  	"domain_match" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "edit_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_id" integer NOT NULL,
  	"user_id" integer,
  	"summary" varchar NOT NULL,
  	"details" varchar NOT NULL,
  	"status" "enum_edit_requests_status" DEFAULT 'new' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_reports_kind" NOT NULL,
  	"status" "enum_reports_status" DEFAULT 'new' NOT NULL,
  	"company_id" integer,
  	"review_id" integer,
  	"subject" varchar NOT NULL,
  	"message" varchar,
  	"name" varchar,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_leads_type" NOT NULL,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"assigned_to_id" integer,
  	"company_id" integer,
  	"name" varchar NOT NULL,
  	"contact" varchar NOT NULL,
  	"organisation" varchar,
  	"interest" varchar,
  	"message" varchar,
  	"consent" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "featured_slots" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"company_id" integer NOT NULL,
  	"placement" "enum_featured_slots_placement" NOT NULL,
  	"category_id" integer,
  	"start" timestamp(3) with time zone NOT NULL,
  	"end" timestamp(3) with time zone NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "insights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"author" varchar DEFAULT 'BusinessLens Research',
  	"excerpt" varchar,
  	"body" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"body" jsonb,
  	"meta_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_alerts_kind" DEFAULT 'regulator',
  	"date" timestamp(3) with time zone NOT NULL,
  	"active" boolean DEFAULT true,
  	"regulator_id" integer,
  	"company_id" integer,
  	"named_entity" varchar,
  	"summary" varchar,
  	"official_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'member' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar,
  	"collection_slug" varchar,
  	"doc_id" varchar,
  	"doc_label" varchar,
  	"changed_fields" varchar,
  	"user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"companies_id" integer,
  	"licences_id" integer,
  	"categories_id" integer,
  	"regulators_id" integer,
  	"ratings_id" integer,
  	"methodologies_id" integer,
  	"reviews_id" integer,
  	"claims_id" integer,
  	"edit_requests_id" integer,
  	"reports_id" integer,
  	"leads_id" integer,
  	"featured_slots_id" integer,
  	"subscribers_id" integer,
  	"insights_id" integer,
  	"pages_id" integer,
  	"alerts_id" integer,
  	"users_id" integer,
  	"audit_log_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "home_popular_searches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar DEFAULT 'Know who you are trusting with your money.',
  	"subline" varchar DEFAULT 'Independent ratings, verified licences and real reviews for brokers, banks, custodians, funds and fintechs across the Middle East and beyond.',
  	"institutions_title" varchar DEFAULT 'Are you a financial institution?',
  	"institutions_text" varchar DEFAULT 'Claim your free profile, see your rating breakdown and learn how to improve it.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "companies_brand_names" ADD CONSTRAINT "companies_brand_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_former_names" ADD CONSTRAINT "companies_former_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_operating_countries" ADD CONSTRAINT "companies_operating_countries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_team" ADD CONSTRAINT "companies_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_offices" ADD CONSTRAINT "companies_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_news" ADD CONSTRAINT "companies_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_documents" ADD CONSTRAINT "companies_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies" ADD CONSTRAINT "companies_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "companies_rels" ADD CONSTRAINT "companies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_rels" ADD CONSTRAINT "companies_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "companies_rels" ADD CONSTRAINT "companies_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_brand_names" ADD CONSTRAINT "_companies_v_version_brand_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_former_names" ADD CONSTRAINT "_companies_v_version_former_names_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_operating_countries" ADD CONSTRAINT "_companies_v_version_operating_countries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_team" ADD CONSTRAINT "_companies_v_version_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_offices" ADD CONSTRAINT "_companies_v_version_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_news" ADD CONSTRAINT "_companies_v_version_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_version_documents" ADD CONSTRAINT "_companies_v_version_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v" ADD CONSTRAINT "_companies_v_parent_id_companies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_companies_v" ADD CONSTRAINT "_companies_v_version_primary_category_id_categories_id_fk" FOREIGN KEY ("version_primary_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_companies_v_rels" ADD CONSTRAINT "_companies_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_companies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_rels" ADD CONSTRAINT "_companies_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_companies_v_rels" ADD CONSTRAINT "_companies_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "licences" ADD CONSTRAINT "licences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "licences" ADD CONSTRAINT "licences_regulator_id_regulators_id_fk" FOREIGN KEY ("regulator_id") REFERENCES "public"."regulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ratings_scores" ADD CONSTRAINT "ratings_scores_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ratings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ratings" ADD CONSTRAINT "ratings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ratings" ADD CONSTRAINT "ratings_methodology_id_methodologies_id_fk" FOREIGN KEY ("methodology_id") REFERENCES "public"."methodologies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ratings" ADD CONSTRAINT "ratings_analyst_id_users_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ratings_v_version_scores" ADD CONSTRAINT "_ratings_v_version_scores_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ratings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ratings_v" ADD CONSTRAINT "_ratings_v_parent_id_ratings_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ratings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ratings_v" ADD CONSTRAINT "_ratings_v_version_company_id_companies_id_fk" FOREIGN KEY ("version_company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ratings_v" ADD CONSTRAINT "_ratings_v_version_methodology_id_methodologies_id_fk" FOREIGN KEY ("version_methodology_id") REFERENCES "public"."methodologies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ratings_v" ADD CONSTRAINT "_ratings_v_version_analyst_id_users_id_fk" FOREIGN KEY ("version_analyst_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "methodologies_criteria" ADD CONSTRAINT "methodologies_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."methodologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "methodologies_bands" ADD CONSTRAINT "methodologies_bands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."methodologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "methodologies_rels" ADD CONSTRAINT "methodologies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."methodologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "methodologies_rels" ADD CONSTRAINT "methodologies_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_rels" ADD CONSTRAINT "reviews_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews_rels" ADD CONSTRAINT "reviews_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "claims" ADD CONSTRAINT "claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "edit_requests" ADD CONSTRAINT "edit_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_regulator_id_regulators_id_fk" FOREIGN KEY ("regulator_id") REFERENCES "public"."regulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_companies_fk" FOREIGN KEY ("companies_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_licences_fk" FOREIGN KEY ("licences_id") REFERENCES "public"."licences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regulators_fk" FOREIGN KEY ("regulators_id") REFERENCES "public"."regulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ratings_fk" FOREIGN KEY ("ratings_id") REFERENCES "public"."ratings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_methodologies_fk" FOREIGN KEY ("methodologies_id") REFERENCES "public"."methodologies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_claims_fk" FOREIGN KEY ("claims_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_edit_requests_fk" FOREIGN KEY ("edit_requests_id") REFERENCES "public"."edit_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_featured_slots_fk" FOREIGN KEY ("featured_slots_id") REFERENCES "public"."featured_slots"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_insights_fk" FOREIGN KEY ("insights_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alerts_fk" FOREIGN KEY ("alerts_id") REFERENCES "public"."alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_popular_searches" ADD CONSTRAINT "home_popular_searches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "companies_brand_names_order_idx" ON "companies_brand_names" USING btree ("_order");
  CREATE INDEX "companies_brand_names_parent_id_idx" ON "companies_brand_names" USING btree ("_parent_id");
  CREATE INDEX "companies_former_names_order_idx" ON "companies_former_names" USING btree ("_order");
  CREATE INDEX "companies_former_names_parent_id_idx" ON "companies_former_names" USING btree ("_parent_id");
  CREATE INDEX "companies_operating_countries_order_idx" ON "companies_operating_countries" USING btree ("_order");
  CREATE INDEX "companies_operating_countries_parent_id_idx" ON "companies_operating_countries" USING btree ("_parent_id");
  CREATE INDEX "companies_team_order_idx" ON "companies_team" USING btree ("_order");
  CREATE INDEX "companies_team_parent_id_idx" ON "companies_team" USING btree ("_parent_id");
  CREATE INDEX "companies_offices_order_idx" ON "companies_offices" USING btree ("_order");
  CREATE INDEX "companies_offices_parent_id_idx" ON "companies_offices" USING btree ("_parent_id");
  CREATE INDEX "companies_news_order_idx" ON "companies_news" USING btree ("_order");
  CREATE INDEX "companies_news_parent_id_idx" ON "companies_news" USING btree ("_parent_id");
  CREATE INDEX "companies_documents_order_idx" ON "companies_documents" USING btree ("_order");
  CREATE INDEX "companies_documents_parent_id_idx" ON "companies_documents" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "companies_slug_idx" ON "companies" USING btree ("slug");
  CREATE UNIQUE INDEX "companies_entity_id_idx" ON "companies" USING btree ("entity_id");
  CREATE INDEX "companies_primary_category_idx" ON "companies" USING btree ("primary_category_id");
  CREATE INDEX "companies_group_id_idx" ON "companies" USING btree ("group_id");
  CREATE INDEX "companies_lei_idx" ON "companies" USING btree ("lei");
  CREATE INDEX "companies_updated_at_idx" ON "companies" USING btree ("updated_at");
  CREATE INDEX "companies_created_at_idx" ON "companies" USING btree ("created_at");
  CREATE INDEX "companies_rels_order_idx" ON "companies_rels" USING btree ("order");
  CREATE INDEX "companies_rels_parent_idx" ON "companies_rels" USING btree ("parent_id");
  CREATE INDEX "companies_rels_path_idx" ON "companies_rels" USING btree ("path");
  CREATE INDEX "companies_rels_categories_id_idx" ON "companies_rels" USING btree ("categories_id");
  CREATE INDEX "companies_rels_users_id_idx" ON "companies_rels" USING btree ("users_id");
  CREATE INDEX "_companies_v_version_brand_names_order_idx" ON "_companies_v_version_brand_names" USING btree ("_order");
  CREATE INDEX "_companies_v_version_brand_names_parent_id_idx" ON "_companies_v_version_brand_names" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_former_names_order_idx" ON "_companies_v_version_former_names" USING btree ("_order");
  CREATE INDEX "_companies_v_version_former_names_parent_id_idx" ON "_companies_v_version_former_names" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_operating_countries_order_idx" ON "_companies_v_version_operating_countries" USING btree ("_order");
  CREATE INDEX "_companies_v_version_operating_countries_parent_id_idx" ON "_companies_v_version_operating_countries" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_team_order_idx" ON "_companies_v_version_team" USING btree ("_order");
  CREATE INDEX "_companies_v_version_team_parent_id_idx" ON "_companies_v_version_team" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_offices_order_idx" ON "_companies_v_version_offices" USING btree ("_order");
  CREATE INDEX "_companies_v_version_offices_parent_id_idx" ON "_companies_v_version_offices" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_news_order_idx" ON "_companies_v_version_news" USING btree ("_order");
  CREATE INDEX "_companies_v_version_news_parent_id_idx" ON "_companies_v_version_news" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_version_documents_order_idx" ON "_companies_v_version_documents" USING btree ("_order");
  CREATE INDEX "_companies_v_version_documents_parent_id_idx" ON "_companies_v_version_documents" USING btree ("_parent_id");
  CREATE INDEX "_companies_v_parent_idx" ON "_companies_v" USING btree ("parent_id");
  CREATE INDEX "_companies_v_version_version_slug_idx" ON "_companies_v" USING btree ("version_slug");
  CREATE INDEX "_companies_v_version_version_entity_id_idx" ON "_companies_v" USING btree ("version_entity_id");
  CREATE INDEX "_companies_v_version_version_primary_category_idx" ON "_companies_v" USING btree ("version_primary_category_id");
  CREATE INDEX "_companies_v_version_version_group_id_idx" ON "_companies_v" USING btree ("version_group_id");
  CREATE INDEX "_companies_v_version_version_lei_idx" ON "_companies_v" USING btree ("version_lei");
  CREATE INDEX "_companies_v_version_version_updated_at_idx" ON "_companies_v" USING btree ("version_updated_at");
  CREATE INDEX "_companies_v_version_version_created_at_idx" ON "_companies_v" USING btree ("version_created_at");
  CREATE INDEX "_companies_v_created_at_idx" ON "_companies_v" USING btree ("created_at");
  CREATE INDEX "_companies_v_updated_at_idx" ON "_companies_v" USING btree ("updated_at");
  CREATE INDEX "_companies_v_rels_order_idx" ON "_companies_v_rels" USING btree ("order");
  CREATE INDEX "_companies_v_rels_parent_idx" ON "_companies_v_rels" USING btree ("parent_id");
  CREATE INDEX "_companies_v_rels_path_idx" ON "_companies_v_rels" USING btree ("path");
  CREATE INDEX "_companies_v_rels_categories_id_idx" ON "_companies_v_rels" USING btree ("categories_id");
  CREATE INDEX "_companies_v_rels_users_id_idx" ON "_companies_v_rels" USING btree ("users_id");
  CREATE INDEX "licences_company_idx" ON "licences" USING btree ("company_id");
  CREATE INDEX "licences_regulator_idx" ON "licences" USING btree ("regulator_id");
  CREATE INDEX "licences_licence_number_idx" ON "licences" USING btree ("licence_number");
  CREATE INDEX "licences_updated_at_idx" ON "licences" USING btree ("updated_at");
  CREATE INDEX "licences_created_at_idx" ON "licences" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "regulators_code_idx" ON "regulators" USING btree ("code");
  CREATE UNIQUE INDEX "regulators_slug_idx" ON "regulators" USING btree ("slug");
  CREATE INDEX "regulators_updated_at_idx" ON "regulators" USING btree ("updated_at");
  CREATE INDEX "regulators_created_at_idx" ON "regulators" USING btree ("created_at");
  CREATE INDEX "ratings_scores_order_idx" ON "ratings_scores" USING btree ("_order");
  CREATE INDEX "ratings_scores_parent_id_idx" ON "ratings_scores" USING btree ("_parent_id");
  CREATE INDEX "ratings_company_idx" ON "ratings" USING btree ("company_id");
  CREATE INDEX "ratings_methodology_idx" ON "ratings" USING btree ("methodology_id");
  CREATE INDEX "ratings_analyst_idx" ON "ratings" USING btree ("analyst_id");
  CREATE INDEX "ratings_updated_at_idx" ON "ratings" USING btree ("updated_at");
  CREATE INDEX "ratings_created_at_idx" ON "ratings" USING btree ("created_at");
  CREATE INDEX "_ratings_v_version_scores_order_idx" ON "_ratings_v_version_scores" USING btree ("_order");
  CREATE INDEX "_ratings_v_version_scores_parent_id_idx" ON "_ratings_v_version_scores" USING btree ("_parent_id");
  CREATE INDEX "_ratings_v_parent_idx" ON "_ratings_v" USING btree ("parent_id");
  CREATE INDEX "_ratings_v_version_version_company_idx" ON "_ratings_v" USING btree ("version_company_id");
  CREATE INDEX "_ratings_v_version_version_methodology_idx" ON "_ratings_v" USING btree ("version_methodology_id");
  CREATE INDEX "_ratings_v_version_version_analyst_idx" ON "_ratings_v" USING btree ("version_analyst_id");
  CREATE INDEX "_ratings_v_version_version_updated_at_idx" ON "_ratings_v" USING btree ("version_updated_at");
  CREATE INDEX "_ratings_v_version_version_created_at_idx" ON "_ratings_v" USING btree ("version_created_at");
  CREATE INDEX "_ratings_v_created_at_idx" ON "_ratings_v" USING btree ("created_at");
  CREATE INDEX "_ratings_v_updated_at_idx" ON "_ratings_v" USING btree ("updated_at");
  CREATE INDEX "methodologies_criteria_order_idx" ON "methodologies_criteria" USING btree ("_order");
  CREATE INDEX "methodologies_criteria_parent_id_idx" ON "methodologies_criteria" USING btree ("_parent_id");
  CREATE INDEX "methodologies_bands_order_idx" ON "methodologies_bands" USING btree ("_order");
  CREATE INDEX "methodologies_bands_parent_id_idx" ON "methodologies_bands" USING btree ("_parent_id");
  CREATE INDEX "methodologies_updated_at_idx" ON "methodologies" USING btree ("updated_at");
  CREATE INDEX "methodologies_created_at_idx" ON "methodologies" USING btree ("created_at");
  CREATE INDEX "methodologies_rels_order_idx" ON "methodologies_rels" USING btree ("order");
  CREATE INDEX "methodologies_rels_parent_idx" ON "methodologies_rels" USING btree ("parent_id");
  CREATE INDEX "methodologies_rels_path_idx" ON "methodologies_rels" USING btree ("path");
  CREATE INDEX "methodologies_rels_categories_id_idx" ON "methodologies_rels" USING btree ("categories_id");
  CREATE INDEX "reviews_company_idx" ON "reviews" USING btree ("company_id");
  CREATE INDEX "reviews_author_idx" ON "reviews" USING btree ("author_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "reviews_rels_order_idx" ON "reviews_rels" USING btree ("order");
  CREATE INDEX "reviews_rels_parent_idx" ON "reviews_rels" USING btree ("parent_id");
  CREATE INDEX "reviews_rels_path_idx" ON "reviews_rels" USING btree ("path");
  CREATE INDEX "reviews_rels_users_id_idx" ON "reviews_rels" USING btree ("users_id");
  CREATE INDEX "claims_company_idx" ON "claims" USING btree ("company_id");
  CREATE INDEX "claims_user_idx" ON "claims" USING btree ("user_id");
  CREATE INDEX "claims_updated_at_idx" ON "claims" USING btree ("updated_at");
  CREATE INDEX "claims_created_at_idx" ON "claims" USING btree ("created_at");
  CREATE INDEX "edit_requests_company_idx" ON "edit_requests" USING btree ("company_id");
  CREATE INDEX "edit_requests_user_idx" ON "edit_requests" USING btree ("user_id");
  CREATE INDEX "edit_requests_updated_at_idx" ON "edit_requests" USING btree ("updated_at");
  CREATE INDEX "edit_requests_created_at_idx" ON "edit_requests" USING btree ("created_at");
  CREATE INDEX "reports_company_idx" ON "reports" USING btree ("company_id");
  CREATE INDEX "reports_review_idx" ON "reports" USING btree ("review_id");
  CREATE INDEX "reports_updated_at_idx" ON "reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");
  CREATE INDEX "leads_assigned_to_idx" ON "leads" USING btree ("assigned_to_id");
  CREATE INDEX "leads_company_idx" ON "leads" USING btree ("company_id");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "featured_slots_company_idx" ON "featured_slots" USING btree ("company_id");
  CREATE INDEX "featured_slots_category_idx" ON "featured_slots" USING btree ("category_id");
  CREATE INDEX "featured_slots_updated_at_idx" ON "featured_slots" USING btree ("updated_at");
  CREATE INDEX "featured_slots_created_at_idx" ON "featured_slots" USING btree ("created_at");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE UNIQUE INDEX "insights_slug_idx" ON "insights" USING btree ("slug");
  CREATE INDEX "insights_updated_at_idx" ON "insights" USING btree ("updated_at");
  CREATE INDEX "insights_created_at_idx" ON "insights" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "alerts_regulator_idx" ON "alerts" USING btree ("regulator_id");
  CREATE INDEX "alerts_company_idx" ON "alerts" USING btree ("company_id");
  CREATE INDEX "alerts_updated_at_idx" ON "alerts" USING btree ("updated_at");
  CREATE INDEX "alerts_created_at_idx" ON "alerts" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_companies_id_idx" ON "payload_locked_documents_rels" USING btree ("companies_id");
  CREATE INDEX "payload_locked_documents_rels_licences_id_idx" ON "payload_locked_documents_rels" USING btree ("licences_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_regulators_id_idx" ON "payload_locked_documents_rels" USING btree ("regulators_id");
  CREATE INDEX "payload_locked_documents_rels_ratings_id_idx" ON "payload_locked_documents_rels" USING btree ("ratings_id");
  CREATE INDEX "payload_locked_documents_rels_methodologies_id_idx" ON "payload_locked_documents_rels" USING btree ("methodologies_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_claims_id_idx" ON "payload_locked_documents_rels" USING btree ("claims_id");
  CREATE INDEX "payload_locked_documents_rels_edit_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("edit_requests_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_featured_slots_id_idx" ON "payload_locked_documents_rels" USING btree ("featured_slots_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_insights_id_idx" ON "payload_locked_documents_rels" USING btree ("insights_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("alerts_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "home_popular_searches_order_idx" ON "home_popular_searches" USING btree ("_order");
  CREATE INDEX "home_popular_searches_parent_id_idx" ON "home_popular_searches" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "companies_brand_names" CASCADE;
  DROP TABLE "companies_former_names" CASCADE;
  DROP TABLE "companies_operating_countries" CASCADE;
  DROP TABLE "companies_team" CASCADE;
  DROP TABLE "companies_offices" CASCADE;
  DROP TABLE "companies_news" CASCADE;
  DROP TABLE "companies_documents" CASCADE;
  DROP TABLE "companies" CASCADE;
  DROP TABLE "companies_rels" CASCADE;
  DROP TABLE "_companies_v_version_brand_names" CASCADE;
  DROP TABLE "_companies_v_version_former_names" CASCADE;
  DROP TABLE "_companies_v_version_operating_countries" CASCADE;
  DROP TABLE "_companies_v_version_team" CASCADE;
  DROP TABLE "_companies_v_version_offices" CASCADE;
  DROP TABLE "_companies_v_version_news" CASCADE;
  DROP TABLE "_companies_v_version_documents" CASCADE;
  DROP TABLE "_companies_v" CASCADE;
  DROP TABLE "_companies_v_rels" CASCADE;
  DROP TABLE "licences" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "regulators" CASCADE;
  DROP TABLE "ratings_scores" CASCADE;
  DROP TABLE "ratings" CASCADE;
  DROP TABLE "_ratings_v_version_scores" CASCADE;
  DROP TABLE "_ratings_v" CASCADE;
  DROP TABLE "methodologies_criteria" CASCADE;
  DROP TABLE "methodologies_bands" CASCADE;
  DROP TABLE "methodologies" CASCADE;
  DROP TABLE "methodologies_rels" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "reviews_rels" CASCADE;
  DROP TABLE "claims" CASCADE;
  DROP TABLE "edit_requests" CASCADE;
  DROP TABLE "reports" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "featured_slots" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "insights" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "alerts" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "home_popular_searches" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TYPE "public"."enum_companies_tier";
  DROP TYPE "public"."enum_companies_rating_state";
  DROP TYPE "public"."enum_companies_confidence";
  DROP TYPE "public"."enum__companies_v_version_tier";
  DROP TYPE "public"."enum__companies_v_version_rating_state";
  DROP TYPE "public"."enum__companies_v_version_confidence";
  DROP TYPE "public"."enum_licences_status";
  DROP TYPE "public"."enum_ratings_status";
  DROP TYPE "public"."enum_ratings_state";
  DROP TYPE "public"."enum__ratings_v_version_status";
  DROP TYPE "public"."enum__ratings_v_version_state";
  DROP TYPE "public"."enum_reviews_relationship";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum_reviews_reply_status";
  DROP TYPE "public"."enum_claims_status";
  DROP TYPE "public"."enum_edit_requests_status";
  DROP TYPE "public"."enum_reports_kind";
  DROP TYPE "public"."enum_reports_status";
  DROP TYPE "public"."enum_leads_type";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_featured_slots_placement";
  DROP TYPE "public"."enum_alerts_kind";
  DROP TYPE "public"."enum_users_role";`)
}
