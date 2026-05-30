CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`branchCode` varchar(50) NOT NULL,
	`storeId` int NOT NULL,
	`branchName` varchar(255) NOT NULL,
	`managerId` int,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(100),
	`zipCode` varchar(20),
	`country` varchar(100) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`phone` varchar(20),
	`email` varchar(320),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_branchCode_unique` UNIQUE(`branchCode`)
);
--> statement-breakpoint
CREATE TABLE `managerAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`storeId` int NOT NULL,
	`branchId` int,
	`assignmentType` enum('store','branch') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `managerAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storeId` int NOT NULL,
	`username` varchar(255) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `storeCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `storeCredentials_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `storeCredentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeCode` varchar(50) NOT NULL,
	`storeName` varchar(255) NOT NULL,
	`adminId` int NOT NULL,
	`developerId` int NOT NULL,
	`description` text,
	`logo` text,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`website` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_storeCode_unique` UNIQUE(`storeCode`)
);
--> statement-breakpoint
CREATE INDEX `storeIdx` ON `branches` (`storeId`);--> statement-breakpoint
CREATE INDEX `managerIdx` ON `branches` (`managerId`);--> statement-breakpoint
CREATE INDEX `managerIdx` ON `managerAssignments` (`managerId`);--> statement-breakpoint
CREATE INDEX `storeIdx` ON `managerAssignments` (`storeId`);--> statement-breakpoint
CREATE INDEX `branchIdx` ON `managerAssignments` (`branchId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `storeCredentials` (`userId`);--> statement-breakpoint
CREATE INDEX `storeIdx` ON `storeCredentials` (`storeId`);--> statement-breakpoint
CREATE INDEX `adminIdx` ON `stores` (`adminId`);--> statement-breakpoint
CREATE INDEX `developerIdx` ON `stores` (`developerId`);