-- CreateTable
CREATE TABLE "Users" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profile_picture" TEXT NOT NULL,
    "default_location_latitude" DOUBLE PRECISION NOT NULL,
    "default_location_longitude" DOUBLE PRECISION NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sports" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Sports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Sports" (
    "user_id" BIGINT NOT NULL,
    "sport_id" BIGINT NOT NULL,
    "skill_level" TEXT NOT NULL,

    CONSTRAINT "User_Sports_pkey" PRIMARY KEY ("user_id","sport_id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "published_date" TIMESTAMP(3) NOT NULL,
    "sport_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" BIGSERIAL NOT NULL,
    "creator_id" BIGINT NOT NULL,
    "sport_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_latitude" DOUBLE PRECISION NOT NULL,
    "location_longitude" DOUBLE PRECISION NOT NULL,
    "max_participants" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event_Participants" (
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,

    CONSTRAINT "Event_Participants_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "Event_Ratings" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_Ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_id" BIGINT NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reports" (
    "id" BIGSERIAL NOT NULL,
    "reporter_id" BIGINT NOT NULL,
    "reported_id" BIGINT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "report_reason" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "admin_notes" TEXT,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin_Logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_Logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_Ratings" (
    "id" BIGSERIAL NOT NULL,
    "rated_user_id" BIGINT NOT NULL,
    "rating_user_id" BIGINT NOT NULL,
    "rating_value" INTEGER NOT NULL,
    "review_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_Ratings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User_Sports" ADD CONSTRAINT "User_Sports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Sports" ADD CONSTRAINT "User_Sports_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "Sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "Sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_sport_id_fkey" FOREIGN KEY ("sport_id") REFERENCES "Sports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Participants" ADD CONSTRAINT "Event_Participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Participants" ADD CONSTRAINT "Event_Participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Ratings" ADD CONSTRAINT "Event_Ratings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Ratings" ADD CONSTRAINT "Event_Ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin_Logs" ADD CONSTRAINT "Admin_Logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Ratings" ADD CONSTRAINT "User_Ratings_rated_user_id_fkey" FOREIGN KEY ("rated_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Ratings" ADD CONSTRAINT "User_Ratings_rating_user_id_fkey" FOREIGN KEY ("rating_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
