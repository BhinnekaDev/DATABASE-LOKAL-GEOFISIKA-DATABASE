create type "public"."admin_role" as enum ('operator', 'admin');

create sequence "public"."admin_id_seq";

create sequence "public"."air_pressure_id_seq";

create sequence "public"."average_temperature_id_seq";

create sequence "public"."document_id_seq";

create sequence "public"."earthquake_id_seq";

create sequence "public"."evaporation_id_seq";

create sequence "public"."humidity_id_seq";

create sequence "public"."lightning_id_seq";

create sequence "public"."max_temperature_id_seq";

create sequence "public"."min_temperature_id_seq";

create sequence "public"."observer_id_seq";

create sequence "public"."rain_intensity_id_seq";

create sequence "public"."rainfall_id_seq";

create sequence "public"."rainy_days_id_seq";

create sequence "public"."sunshine_duration_id_seq";

create sequence "public"."time_signature_id_seq";

create sequence "public"."weather_data_id_seq";

create sequence "public"."wind_direction_and_speed_id_seq";

create table "public"."activity_log" (
    "description" text,
    "ip_address" text,
    "action" text,
    "user_agent" text,
    "created_at" timestamp with time zone default (now() AT TIME ZONE 'utc'::text),
    "admin_id" uuid not null
);


create table "public"."admin" (
    "id" integer not null default nextval('admin_id_seq'::regclass),
    "photo" text,
    "user_id" uuid,
    "first_name" text,
    "last_name" text,
    "role" admin_role not null,
    "email" text
);


create table "public"."air_pressure" (
    "id" integer not null default nextval('air_pressure_id_seq'::regclass),
    "id_weather_data" integer,
    "air_pressure" double precision
);


create table "public"."average_temperature" (
    "id" integer not null default nextval('average_temperature_id_seq'::regclass),
    "id_weather_data" integer,
    "avg_temperature" double precision
);


create table "public"."document" (
    "id" integer not null default nextval('document_id_seq'::regclass),
    "file_path" text,
    "document_date" date,
    "document_name" text
);


create table "public"."earthquake" (
    "id" integer not null default nextval('earthquake_id_seq'::regclass),
    "date" date,
    "time" time without time zone,
    "mmi" text,
    "description" text,
    "depth" double precision,
    "latitude" double precision,
    "longitude" double precision,
    "magnitude" double precision,
    "observer_id" integer
);


create table "public"."evaporation" (
    "id" integer not null default nextval('evaporation_id_seq'::regclass),
    "evaporation" double precision,
    "date" date
);


create table "public"."humidity" (
    "id" integer not null default nextval('humidity_id_seq'::regclass),
    "id_weather_data" integer,
    "avg_humidity" double precision
);


create table "public"."lightning" (
    "id" integer not null default nextval('lightning_id_seq'::regclass),
    "document_id" integer
);


create table "public"."login_log" (
    "ip_address" text,
    "login_time" date,
    "user_agent" text,
    "admin_id" uuid not null
);


create table "public"."max_temperature" (
    "id" integer not null default nextval('max_temperature_id_seq'::regclass),
    "max_temperature" double precision,
    "date" date
);


create table "public"."min_temperature" (
    "id" integer not null default nextval('min_temperature_id_seq'::regclass),
    "min_temperature" double precision,
    "date" date
);


create table "public"."observer" (
    "id" integer not null default nextval('observer_id_seq'::regclass),
    "observer_name" text
);


create table "public"."rain_intensity" (
    "id" integer not null default nextval('rain_intensity_id_seq'::regclass),
    "name" text
);


create table "public"."rainfall" (
    "id" integer not null default nextval('rainfall_id_seq'::regclass),
    "rainfall" double precision,
    "date" date
);


create table "public"."rainy_days" (
    "id" integer not null default nextval('rainy_days_id_seq'::regclass),
    "rainy_day" text,
    "date" date
);


create table "public"."sunshine_duration" (
    "id" integer not null default nextval('sunshine_duration_id_seq'::regclass),
    "sunshine_duration" double precision
);


create table "public"."time_signature" (
    "id" integer not null default nextval('time_signature_id_seq'::regclass),
    "document_id" integer
);


create table "public"."weather_data" (
    "id" integer not null default nextval('weather_data_id_seq'::regclass),
    "07_00" double precision,
    "13_00" double precision,
    "18_00" double precision
);


create table "public"."wind_direction_and_speed" (
    "id" integer not null default nextval('wind_direction_and_speed_id_seq'::regclass),
    "max_wind_speed" double precision,
    "speed_direction" text,
    "max_wind_direction" text
);


alter sequence "public"."admin_id_seq" owned by "public"."admin"."id";

alter sequence "public"."air_pressure_id_seq" owned by "public"."air_pressure"."id";

alter sequence "public"."average_temperature_id_seq" owned by "public"."average_temperature"."id";

alter sequence "public"."document_id_seq" owned by "public"."document"."id";

alter sequence "public"."earthquake_id_seq" owned by "public"."earthquake"."id";

alter sequence "public"."evaporation_id_seq" owned by "public"."evaporation"."id";

alter sequence "public"."humidity_id_seq" owned by "public"."humidity"."id";

alter sequence "public"."lightning_id_seq" owned by "public"."lightning"."id";

alter sequence "public"."max_temperature_id_seq" owned by "public"."max_temperature"."id";

alter sequence "public"."min_temperature_id_seq" owned by "public"."min_temperature"."id";

alter sequence "public"."observer_id_seq" owned by "public"."observer"."id";

alter sequence "public"."rain_intensity_id_seq" owned by "public"."rain_intensity"."id";

alter sequence "public"."rainfall_id_seq" owned by "public"."rainfall"."id";

alter sequence "public"."rainy_days_id_seq" owned by "public"."rainy_days"."id";

alter sequence "public"."sunshine_duration_id_seq" owned by "public"."sunshine_duration"."id";

alter sequence "public"."time_signature_id_seq" owned by "public"."time_signature"."id";

alter sequence "public"."weather_data_id_seq" owned by "public"."weather_data"."id";

alter sequence "public"."wind_direction_and_speed_id_seq" owned by "public"."wind_direction_and_speed"."id";

CREATE UNIQUE INDEX admin_email_key ON public.admin USING btree (email);

CREATE UNIQUE INDEX admin_pkey ON public.admin USING btree (id);

CREATE UNIQUE INDEX admin_user_id_unique ON public.admin USING btree (user_id);

CREATE UNIQUE INDEX air_pressure_pkey ON public.air_pressure USING btree (id);

CREATE UNIQUE INDEX average_temperature_pkey ON public.average_temperature USING btree (id);

CREATE UNIQUE INDEX document_pkey ON public.document USING btree (id);

CREATE UNIQUE INDEX earthquake_pkey ON public.earthquake USING btree (id);

CREATE UNIQUE INDEX evaporation_pkey ON public.evaporation USING btree (id);

CREATE UNIQUE INDEX humidity_pkey ON public.humidity USING btree (id);

CREATE UNIQUE INDEX lightning_pkey ON public.lightning USING btree (id);

CREATE UNIQUE INDEX login_log_admin_id_key ON public.login_log USING btree (admin_id);

CREATE UNIQUE INDEX login_log_pkey ON public.login_log USING btree (admin_id);

CREATE UNIQUE INDEX max_temperature_pkey ON public.max_temperature USING btree (id);

CREATE UNIQUE INDEX min_temperature_pkey ON public.min_temperature USING btree (id);

CREATE UNIQUE INDEX observer_pkey ON public.observer USING btree (id);

CREATE UNIQUE INDEX rain_intensity_pkey ON public.rain_intensity USING btree (id);

CREATE UNIQUE INDEX rainfall_pkey ON public.rainfall USING btree (id);

CREATE UNIQUE INDEX rainy_days_pkey ON public.rainy_days USING btree (id);

CREATE UNIQUE INDEX sunshine_duration_pkey ON public.sunshine_duration USING btree (id);

CREATE UNIQUE INDEX time_signature_pkey ON public.time_signature USING btree (id);

CREATE UNIQUE INDEX weather_data_pkey ON public.weather_data USING btree (id);

CREATE UNIQUE INDEX wind_direction_and_speed_pkey ON public.wind_direction_and_speed USING btree (id);

alter table "public"."admin" add constraint "admin_pkey" PRIMARY KEY using index "admin_pkey";

alter table "public"."air_pressure" add constraint "air_pressure_pkey" PRIMARY KEY using index "air_pressure_pkey";

alter table "public"."average_temperature" add constraint "average_temperature_pkey" PRIMARY KEY using index "average_temperature_pkey";

alter table "public"."document" add constraint "document_pkey" PRIMARY KEY using index "document_pkey";

alter table "public"."earthquake" add constraint "earthquake_pkey" PRIMARY KEY using index "earthquake_pkey";

alter table "public"."evaporation" add constraint "evaporation_pkey" PRIMARY KEY using index "evaporation_pkey";

alter table "public"."humidity" add constraint "humidity_pkey" PRIMARY KEY using index "humidity_pkey";

alter table "public"."lightning" add constraint "lightning_pkey" PRIMARY KEY using index "lightning_pkey";

alter table "public"."login_log" add constraint "login_log_pkey" PRIMARY KEY using index "login_log_pkey";

alter table "public"."max_temperature" add constraint "max_temperature_pkey" PRIMARY KEY using index "max_temperature_pkey";

alter table "public"."min_temperature" add constraint "min_temperature_pkey" PRIMARY KEY using index "min_temperature_pkey";

alter table "public"."observer" add constraint "observer_pkey" PRIMARY KEY using index "observer_pkey";

alter table "public"."rain_intensity" add constraint "rain_intensity_pkey" PRIMARY KEY using index "rain_intensity_pkey";

alter table "public"."rainfall" add constraint "rainfall_pkey" PRIMARY KEY using index "rainfall_pkey";

alter table "public"."rainy_days" add constraint "rainy_days_pkey" PRIMARY KEY using index "rainy_days_pkey";

alter table "public"."sunshine_duration" add constraint "sunshine_duration_pkey" PRIMARY KEY using index "sunshine_duration_pkey";

alter table "public"."time_signature" add constraint "time_signature_pkey" PRIMARY KEY using index "time_signature_pkey";

alter table "public"."weather_data" add constraint "weather_data_pkey" PRIMARY KEY using index "weather_data_pkey";

alter table "public"."wind_direction_and_speed" add constraint "wind_direction_and_speed_pkey" PRIMARY KEY using index "wind_direction_and_speed_pkey";

alter table "public"."activity_log" add constraint "activity_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admin(user_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."activity_log" validate constraint "activity_log_admin_id_fkey";

alter table "public"."admin" add constraint "admin_email_key" UNIQUE using index "admin_email_key";

alter table "public"."admin" add constraint "admin_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."admin" validate constraint "admin_user_id_fkey";

alter table "public"."admin" add constraint "admin_user_id_unique" UNIQUE using index "admin_user_id_unique";

alter table "public"."air_pressure" add constraint "air_pressure_id_weather_data_fkey" FOREIGN KEY (id_weather_data) REFERENCES weather_data(id) not valid;

alter table "public"."air_pressure" validate constraint "air_pressure_id_weather_data_fkey";

alter table "public"."average_temperature" add constraint "average_temperature_id_weather_data_fkey" FOREIGN KEY (id_weather_data) REFERENCES weather_data(id) not valid;

alter table "public"."average_temperature" validate constraint "average_temperature_id_weather_data_fkey";

alter table "public"."earthquake" add constraint "earthquake_observer_id_fkey" FOREIGN KEY (observer_id) REFERENCES observer(id) ON DELETE SET NULL not valid;

alter table "public"."earthquake" validate constraint "earthquake_observer_id_fkey";

alter table "public"."humidity" add constraint "humidity_id_weather_data_fkey" FOREIGN KEY (id_weather_data) REFERENCES weather_data(id) not valid;

alter table "public"."humidity" validate constraint "humidity_id_weather_data_fkey";

alter table "public"."lightning" add constraint "lightning_document_id_fkey" FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE not valid;

alter table "public"."lightning" validate constraint "lightning_document_id_fkey";

alter table "public"."login_log" add constraint "login_log_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admin(user_id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."login_log" validate constraint "login_log_admin_id_fkey";

alter table "public"."login_log" add constraint "login_log_admin_id_key" UNIQUE using index "login_log_admin_id_key";

alter table "public"."time_signature" add constraint "time_signature_document_id_fkey" FOREIGN KEY (document_id) REFERENCES document(id) ON DELETE CASCADE not valid;

alter table "public"."time_signature" validate constraint "time_signature_document_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_operator()
 RETURNS TABLE(id integer, photo text, first_name text, last_name text, last_login timestamp without time zone, role text, is_active boolean)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select
    a.id,
    a.photo,
    a.first_name,
    a.last_name,
    u.last_sign_in_at as last_login,
    a.role,
    (u.last_sign_in_at > now() - interval '3 months') as is_active
  from admin a
  join auth.users u on a.user_id = u.id
  where a.role = 'operator' and a.user_id = auth.uid();
$function$
;

grant delete on table "public"."activity_log" to "anon";

grant insert on table "public"."activity_log" to "anon";

grant references on table "public"."activity_log" to "anon";

grant select on table "public"."activity_log" to "anon";

grant trigger on table "public"."activity_log" to "anon";

grant truncate on table "public"."activity_log" to "anon";

grant update on table "public"."activity_log" to "anon";

grant delete on table "public"."activity_log" to "authenticated";

grant insert on table "public"."activity_log" to "authenticated";

grant references on table "public"."activity_log" to "authenticated";

grant select on table "public"."activity_log" to "authenticated";

grant trigger on table "public"."activity_log" to "authenticated";

grant truncate on table "public"."activity_log" to "authenticated";

grant update on table "public"."activity_log" to "authenticated";

grant delete on table "public"."activity_log" to "service_role";

grant insert on table "public"."activity_log" to "service_role";

grant references on table "public"."activity_log" to "service_role";

grant select on table "public"."activity_log" to "service_role";

grant trigger on table "public"."activity_log" to "service_role";

grant truncate on table "public"."activity_log" to "service_role";

grant update on table "public"."activity_log" to "service_role";

grant delete on table "public"."admin" to "anon";

grant insert on table "public"."admin" to "anon";

grant references on table "public"."admin" to "anon";

grant select on table "public"."admin" to "anon";

grant trigger on table "public"."admin" to "anon";

grant truncate on table "public"."admin" to "anon";

grant update on table "public"."admin" to "anon";

grant delete on table "public"."admin" to "authenticated";

grant insert on table "public"."admin" to "authenticated";

grant references on table "public"."admin" to "authenticated";

grant select on table "public"."admin" to "authenticated";

grant trigger on table "public"."admin" to "authenticated";

grant truncate on table "public"."admin" to "authenticated";

grant update on table "public"."admin" to "authenticated";

grant delete on table "public"."admin" to "service_role";

grant insert on table "public"."admin" to "service_role";

grant references on table "public"."admin" to "service_role";

grant select on table "public"."admin" to "service_role";

grant trigger on table "public"."admin" to "service_role";

grant truncate on table "public"."admin" to "service_role";

grant update on table "public"."admin" to "service_role";

grant delete on table "public"."air_pressure" to "anon";

grant insert on table "public"."air_pressure" to "anon";

grant references on table "public"."air_pressure" to "anon";

grant select on table "public"."air_pressure" to "anon";

grant trigger on table "public"."air_pressure" to "anon";

grant truncate on table "public"."air_pressure" to "anon";

grant update on table "public"."air_pressure" to "anon";

grant delete on table "public"."air_pressure" to "authenticated";

grant insert on table "public"."air_pressure" to "authenticated";

grant references on table "public"."air_pressure" to "authenticated";

grant select on table "public"."air_pressure" to "authenticated";

grant trigger on table "public"."air_pressure" to "authenticated";

grant truncate on table "public"."air_pressure" to "authenticated";

grant update on table "public"."air_pressure" to "authenticated";

grant delete on table "public"."air_pressure" to "service_role";

grant insert on table "public"."air_pressure" to "service_role";

grant references on table "public"."air_pressure" to "service_role";

grant select on table "public"."air_pressure" to "service_role";

grant trigger on table "public"."air_pressure" to "service_role";

grant truncate on table "public"."air_pressure" to "service_role";

grant update on table "public"."air_pressure" to "service_role";

grant delete on table "public"."average_temperature" to "anon";

grant insert on table "public"."average_temperature" to "anon";

grant references on table "public"."average_temperature" to "anon";

grant select on table "public"."average_temperature" to "anon";

grant trigger on table "public"."average_temperature" to "anon";

grant truncate on table "public"."average_temperature" to "anon";

grant update on table "public"."average_temperature" to "anon";

grant delete on table "public"."average_temperature" to "authenticated";

grant insert on table "public"."average_temperature" to "authenticated";

grant references on table "public"."average_temperature" to "authenticated";

grant select on table "public"."average_temperature" to "authenticated";

grant trigger on table "public"."average_temperature" to "authenticated";

grant truncate on table "public"."average_temperature" to "authenticated";

grant update on table "public"."average_temperature" to "authenticated";

grant delete on table "public"."average_temperature" to "service_role";

grant insert on table "public"."average_temperature" to "service_role";

grant references on table "public"."average_temperature" to "service_role";

grant select on table "public"."average_temperature" to "service_role";

grant trigger on table "public"."average_temperature" to "service_role";

grant truncate on table "public"."average_temperature" to "service_role";

grant update on table "public"."average_temperature" to "service_role";

grant delete on table "public"."document" to "anon";

grant insert on table "public"."document" to "anon";

grant references on table "public"."document" to "anon";

grant select on table "public"."document" to "anon";

grant trigger on table "public"."document" to "anon";

grant truncate on table "public"."document" to "anon";

grant update on table "public"."document" to "anon";

grant delete on table "public"."document" to "authenticated";

grant insert on table "public"."document" to "authenticated";

grant references on table "public"."document" to "authenticated";

grant select on table "public"."document" to "authenticated";

grant trigger on table "public"."document" to "authenticated";

grant truncate on table "public"."document" to "authenticated";

grant update on table "public"."document" to "authenticated";

grant delete on table "public"."document" to "service_role";

grant insert on table "public"."document" to "service_role";

grant references on table "public"."document" to "service_role";

grant select on table "public"."document" to "service_role";

grant trigger on table "public"."document" to "service_role";

grant truncate on table "public"."document" to "service_role";

grant update on table "public"."document" to "service_role";

grant delete on table "public"."earthquake" to "anon";

grant insert on table "public"."earthquake" to "anon";

grant references on table "public"."earthquake" to "anon";

grant select on table "public"."earthquake" to "anon";

grant trigger on table "public"."earthquake" to "anon";

grant truncate on table "public"."earthquake" to "anon";

grant update on table "public"."earthquake" to "anon";

grant delete on table "public"."earthquake" to "authenticated";

grant insert on table "public"."earthquake" to "authenticated";

grant references on table "public"."earthquake" to "authenticated";

grant select on table "public"."earthquake" to "authenticated";

grant trigger on table "public"."earthquake" to "authenticated";

grant truncate on table "public"."earthquake" to "authenticated";

grant update on table "public"."earthquake" to "authenticated";

grant delete on table "public"."earthquake" to "service_role";

grant insert on table "public"."earthquake" to "service_role";

grant references on table "public"."earthquake" to "service_role";

grant select on table "public"."earthquake" to "service_role";

grant trigger on table "public"."earthquake" to "service_role";

grant truncate on table "public"."earthquake" to "service_role";

grant update on table "public"."earthquake" to "service_role";

grant delete on table "public"."evaporation" to "anon";

grant insert on table "public"."evaporation" to "anon";

grant references on table "public"."evaporation" to "anon";

grant select on table "public"."evaporation" to "anon";

grant trigger on table "public"."evaporation" to "anon";

grant truncate on table "public"."evaporation" to "anon";

grant update on table "public"."evaporation" to "anon";

grant delete on table "public"."evaporation" to "authenticated";

grant insert on table "public"."evaporation" to "authenticated";

grant references on table "public"."evaporation" to "authenticated";

grant select on table "public"."evaporation" to "authenticated";

grant trigger on table "public"."evaporation" to "authenticated";

grant truncate on table "public"."evaporation" to "authenticated";

grant update on table "public"."evaporation" to "authenticated";

grant delete on table "public"."evaporation" to "service_role";

grant insert on table "public"."evaporation" to "service_role";

grant references on table "public"."evaporation" to "service_role";

grant select on table "public"."evaporation" to "service_role";

grant trigger on table "public"."evaporation" to "service_role";

grant truncate on table "public"."evaporation" to "service_role";

grant update on table "public"."evaporation" to "service_role";

grant delete on table "public"."humidity" to "anon";

grant insert on table "public"."humidity" to "anon";

grant references on table "public"."humidity" to "anon";

grant select on table "public"."humidity" to "anon";

grant trigger on table "public"."humidity" to "anon";

grant truncate on table "public"."humidity" to "anon";

grant update on table "public"."humidity" to "anon";

grant delete on table "public"."humidity" to "authenticated";

grant insert on table "public"."humidity" to "authenticated";

grant references on table "public"."humidity" to "authenticated";

grant select on table "public"."humidity" to "authenticated";

grant trigger on table "public"."humidity" to "authenticated";

grant truncate on table "public"."humidity" to "authenticated";

grant update on table "public"."humidity" to "authenticated";

grant delete on table "public"."humidity" to "service_role";

grant insert on table "public"."humidity" to "service_role";

grant references on table "public"."humidity" to "service_role";

grant select on table "public"."humidity" to "service_role";

grant trigger on table "public"."humidity" to "service_role";

grant truncate on table "public"."humidity" to "service_role";

grant update on table "public"."humidity" to "service_role";

grant delete on table "public"."lightning" to "anon";

grant insert on table "public"."lightning" to "anon";

grant references on table "public"."lightning" to "anon";

grant select on table "public"."lightning" to "anon";

grant trigger on table "public"."lightning" to "anon";

grant truncate on table "public"."lightning" to "anon";

grant update on table "public"."lightning" to "anon";

grant delete on table "public"."lightning" to "authenticated";

grant insert on table "public"."lightning" to "authenticated";

grant references on table "public"."lightning" to "authenticated";

grant select on table "public"."lightning" to "authenticated";

grant trigger on table "public"."lightning" to "authenticated";

grant truncate on table "public"."lightning" to "authenticated";

grant update on table "public"."lightning" to "authenticated";

grant delete on table "public"."lightning" to "service_role";

grant insert on table "public"."lightning" to "service_role";

grant references on table "public"."lightning" to "service_role";

grant select on table "public"."lightning" to "service_role";

grant trigger on table "public"."lightning" to "service_role";

grant truncate on table "public"."lightning" to "service_role";

grant update on table "public"."lightning" to "service_role";

grant delete on table "public"."login_log" to "anon";

grant insert on table "public"."login_log" to "anon";

grant references on table "public"."login_log" to "anon";

grant select on table "public"."login_log" to "anon";

grant trigger on table "public"."login_log" to "anon";

grant truncate on table "public"."login_log" to "anon";

grant update on table "public"."login_log" to "anon";

grant delete on table "public"."login_log" to "authenticated";

grant insert on table "public"."login_log" to "authenticated";

grant references on table "public"."login_log" to "authenticated";

grant select on table "public"."login_log" to "authenticated";

grant trigger on table "public"."login_log" to "authenticated";

grant truncate on table "public"."login_log" to "authenticated";

grant update on table "public"."login_log" to "authenticated";

grant delete on table "public"."login_log" to "service_role";

grant insert on table "public"."login_log" to "service_role";

grant references on table "public"."login_log" to "service_role";

grant select on table "public"."login_log" to "service_role";

grant trigger on table "public"."login_log" to "service_role";

grant truncate on table "public"."login_log" to "service_role";

grant update on table "public"."login_log" to "service_role";

grant delete on table "public"."max_temperature" to "anon";

grant insert on table "public"."max_temperature" to "anon";

grant references on table "public"."max_temperature" to "anon";

grant select on table "public"."max_temperature" to "anon";

grant trigger on table "public"."max_temperature" to "anon";

grant truncate on table "public"."max_temperature" to "anon";

grant update on table "public"."max_temperature" to "anon";

grant delete on table "public"."max_temperature" to "authenticated";

grant insert on table "public"."max_temperature" to "authenticated";

grant references on table "public"."max_temperature" to "authenticated";

grant select on table "public"."max_temperature" to "authenticated";

grant trigger on table "public"."max_temperature" to "authenticated";

grant truncate on table "public"."max_temperature" to "authenticated";

grant update on table "public"."max_temperature" to "authenticated";

grant delete on table "public"."max_temperature" to "service_role";

grant insert on table "public"."max_temperature" to "service_role";

grant references on table "public"."max_temperature" to "service_role";

grant select on table "public"."max_temperature" to "service_role";

grant trigger on table "public"."max_temperature" to "service_role";

grant truncate on table "public"."max_temperature" to "service_role";

grant update on table "public"."max_temperature" to "service_role";

grant delete on table "public"."min_temperature" to "anon";

grant insert on table "public"."min_temperature" to "anon";

grant references on table "public"."min_temperature" to "anon";

grant select on table "public"."min_temperature" to "anon";

grant trigger on table "public"."min_temperature" to "anon";

grant truncate on table "public"."min_temperature" to "anon";

grant update on table "public"."min_temperature" to "anon";

grant delete on table "public"."min_temperature" to "authenticated";

grant insert on table "public"."min_temperature" to "authenticated";

grant references on table "public"."min_temperature" to "authenticated";

grant select on table "public"."min_temperature" to "authenticated";

grant trigger on table "public"."min_temperature" to "authenticated";

grant truncate on table "public"."min_temperature" to "authenticated";

grant update on table "public"."min_temperature" to "authenticated";

grant delete on table "public"."min_temperature" to "service_role";

grant insert on table "public"."min_temperature" to "service_role";

grant references on table "public"."min_temperature" to "service_role";

grant select on table "public"."min_temperature" to "service_role";

grant trigger on table "public"."min_temperature" to "service_role";

grant truncate on table "public"."min_temperature" to "service_role";

grant update on table "public"."min_temperature" to "service_role";

grant delete on table "public"."observer" to "anon";

grant insert on table "public"."observer" to "anon";

grant references on table "public"."observer" to "anon";

grant select on table "public"."observer" to "anon";

grant trigger on table "public"."observer" to "anon";

grant truncate on table "public"."observer" to "anon";

grant update on table "public"."observer" to "anon";

grant delete on table "public"."observer" to "authenticated";

grant insert on table "public"."observer" to "authenticated";

grant references on table "public"."observer" to "authenticated";

grant select on table "public"."observer" to "authenticated";

grant trigger on table "public"."observer" to "authenticated";

grant truncate on table "public"."observer" to "authenticated";

grant update on table "public"."observer" to "authenticated";

grant delete on table "public"."observer" to "service_role";

grant insert on table "public"."observer" to "service_role";

grant references on table "public"."observer" to "service_role";

grant select on table "public"."observer" to "service_role";

grant trigger on table "public"."observer" to "service_role";

grant truncate on table "public"."observer" to "service_role";

grant update on table "public"."observer" to "service_role";

grant delete on table "public"."rain_intensity" to "anon";

grant insert on table "public"."rain_intensity" to "anon";

grant references on table "public"."rain_intensity" to "anon";

grant select on table "public"."rain_intensity" to "anon";

grant trigger on table "public"."rain_intensity" to "anon";

grant truncate on table "public"."rain_intensity" to "anon";

grant update on table "public"."rain_intensity" to "anon";

grant delete on table "public"."rain_intensity" to "authenticated";

grant insert on table "public"."rain_intensity" to "authenticated";

grant references on table "public"."rain_intensity" to "authenticated";

grant select on table "public"."rain_intensity" to "authenticated";

grant trigger on table "public"."rain_intensity" to "authenticated";

grant truncate on table "public"."rain_intensity" to "authenticated";

grant update on table "public"."rain_intensity" to "authenticated";

grant delete on table "public"."rain_intensity" to "service_role";

grant insert on table "public"."rain_intensity" to "service_role";

grant references on table "public"."rain_intensity" to "service_role";

grant select on table "public"."rain_intensity" to "service_role";

grant trigger on table "public"."rain_intensity" to "service_role";

grant truncate on table "public"."rain_intensity" to "service_role";

grant update on table "public"."rain_intensity" to "service_role";

grant delete on table "public"."rainfall" to "anon";

grant insert on table "public"."rainfall" to "anon";

grant references on table "public"."rainfall" to "anon";

grant select on table "public"."rainfall" to "anon";

grant trigger on table "public"."rainfall" to "anon";

grant truncate on table "public"."rainfall" to "anon";

grant update on table "public"."rainfall" to "anon";

grant delete on table "public"."rainfall" to "authenticated";

grant insert on table "public"."rainfall" to "authenticated";

grant references on table "public"."rainfall" to "authenticated";

grant select on table "public"."rainfall" to "authenticated";

grant trigger on table "public"."rainfall" to "authenticated";

grant truncate on table "public"."rainfall" to "authenticated";

grant update on table "public"."rainfall" to "authenticated";

grant delete on table "public"."rainfall" to "service_role";

grant insert on table "public"."rainfall" to "service_role";

grant references on table "public"."rainfall" to "service_role";

grant select on table "public"."rainfall" to "service_role";

grant trigger on table "public"."rainfall" to "service_role";

grant truncate on table "public"."rainfall" to "service_role";

grant update on table "public"."rainfall" to "service_role";

grant delete on table "public"."rainy_days" to "anon";

grant insert on table "public"."rainy_days" to "anon";

grant references on table "public"."rainy_days" to "anon";

grant select on table "public"."rainy_days" to "anon";

grant trigger on table "public"."rainy_days" to "anon";

grant truncate on table "public"."rainy_days" to "anon";

grant update on table "public"."rainy_days" to "anon";

grant delete on table "public"."rainy_days" to "authenticated";

grant insert on table "public"."rainy_days" to "authenticated";

grant references on table "public"."rainy_days" to "authenticated";

grant select on table "public"."rainy_days" to "authenticated";

grant trigger on table "public"."rainy_days" to "authenticated";

grant truncate on table "public"."rainy_days" to "authenticated";

grant update on table "public"."rainy_days" to "authenticated";

grant delete on table "public"."rainy_days" to "service_role";

grant insert on table "public"."rainy_days" to "service_role";

grant references on table "public"."rainy_days" to "service_role";

grant select on table "public"."rainy_days" to "service_role";

grant trigger on table "public"."rainy_days" to "service_role";

grant truncate on table "public"."rainy_days" to "service_role";

grant update on table "public"."rainy_days" to "service_role";

grant delete on table "public"."sunshine_duration" to "anon";

grant insert on table "public"."sunshine_duration" to "anon";

grant references on table "public"."sunshine_duration" to "anon";

grant select on table "public"."sunshine_duration" to "anon";

grant trigger on table "public"."sunshine_duration" to "anon";

grant truncate on table "public"."sunshine_duration" to "anon";

grant update on table "public"."sunshine_duration" to "anon";

grant delete on table "public"."sunshine_duration" to "authenticated";

grant insert on table "public"."sunshine_duration" to "authenticated";

grant references on table "public"."sunshine_duration" to "authenticated";

grant select on table "public"."sunshine_duration" to "authenticated";

grant trigger on table "public"."sunshine_duration" to "authenticated";

grant truncate on table "public"."sunshine_duration" to "authenticated";

grant update on table "public"."sunshine_duration" to "authenticated";

grant delete on table "public"."sunshine_duration" to "service_role";

grant insert on table "public"."sunshine_duration" to "service_role";

grant references on table "public"."sunshine_duration" to "service_role";

grant select on table "public"."sunshine_duration" to "service_role";

grant trigger on table "public"."sunshine_duration" to "service_role";

grant truncate on table "public"."sunshine_duration" to "service_role";

grant update on table "public"."sunshine_duration" to "service_role";

grant delete on table "public"."time_signature" to "anon";

grant insert on table "public"."time_signature" to "anon";

grant references on table "public"."time_signature" to "anon";

grant select on table "public"."time_signature" to "anon";

grant trigger on table "public"."time_signature" to "anon";

grant truncate on table "public"."time_signature" to "anon";

grant update on table "public"."time_signature" to "anon";

grant delete on table "public"."time_signature" to "authenticated";

grant insert on table "public"."time_signature" to "authenticated";

grant references on table "public"."time_signature" to "authenticated";

grant select on table "public"."time_signature" to "authenticated";

grant trigger on table "public"."time_signature" to "authenticated";

grant truncate on table "public"."time_signature" to "authenticated";

grant update on table "public"."time_signature" to "authenticated";

grant delete on table "public"."time_signature" to "service_role";

grant insert on table "public"."time_signature" to "service_role";

grant references on table "public"."time_signature" to "service_role";

grant select on table "public"."time_signature" to "service_role";

grant trigger on table "public"."time_signature" to "service_role";

grant truncate on table "public"."time_signature" to "service_role";

grant update on table "public"."time_signature" to "service_role";

grant delete on table "public"."weather_data" to "anon";

grant insert on table "public"."weather_data" to "anon";

grant references on table "public"."weather_data" to "anon";

grant select on table "public"."weather_data" to "anon";

grant trigger on table "public"."weather_data" to "anon";

grant truncate on table "public"."weather_data" to "anon";

grant update on table "public"."weather_data" to "anon";

grant delete on table "public"."weather_data" to "authenticated";

grant insert on table "public"."weather_data" to "authenticated";

grant references on table "public"."weather_data" to "authenticated";

grant select on table "public"."weather_data" to "authenticated";

grant trigger on table "public"."weather_data" to "authenticated";

grant truncate on table "public"."weather_data" to "authenticated";

grant update on table "public"."weather_data" to "authenticated";

grant delete on table "public"."weather_data" to "service_role";

grant insert on table "public"."weather_data" to "service_role";

grant references on table "public"."weather_data" to "service_role";

grant select on table "public"."weather_data" to "service_role";

grant trigger on table "public"."weather_data" to "service_role";

grant truncate on table "public"."weather_data" to "service_role";

grant update on table "public"."weather_data" to "service_role";

grant delete on table "public"."wind_direction_and_speed" to "anon";

grant insert on table "public"."wind_direction_and_speed" to "anon";

grant references on table "public"."wind_direction_and_speed" to "anon";

grant select on table "public"."wind_direction_and_speed" to "anon";

grant trigger on table "public"."wind_direction_and_speed" to "anon";

grant truncate on table "public"."wind_direction_and_speed" to "anon";

grant update on table "public"."wind_direction_and_speed" to "anon";

grant delete on table "public"."wind_direction_and_speed" to "authenticated";

grant insert on table "public"."wind_direction_and_speed" to "authenticated";

grant references on table "public"."wind_direction_and_speed" to "authenticated";

grant select on table "public"."wind_direction_and_speed" to "authenticated";

grant trigger on table "public"."wind_direction_and_speed" to "authenticated";

grant truncate on table "public"."wind_direction_and_speed" to "authenticated";

grant update on table "public"."wind_direction_and_speed" to "authenticated";

grant delete on table "public"."wind_direction_and_speed" to "service_role";

grant insert on table "public"."wind_direction_and_speed" to "service_role";

grant references on table "public"."wind_direction_and_speed" to "service_role";

grant select on table "public"."wind_direction_and_speed" to "service_role";

grant trigger on table "public"."wind_direction_and_speed" to "service_role";

grant truncate on table "public"."wind_direction_and_speed" to "service_role";

grant update on table "public"."wind_direction_and_speed" to "service_role";

create policy "Hanya admin bisa lihat datanya sendiri"
on "public"."admin"
as permissive
for select
to public
using ((auth.uid() = user_id));
