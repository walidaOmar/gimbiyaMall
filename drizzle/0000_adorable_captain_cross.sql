CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`image` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `commissionLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderItemId` int,
	`adminProfit` decimal(12,2) NOT NULL DEFAULT '0',
	`developerCommission` decimal(12,2) NOT NULL DEFAULT '0',
	`readerCommission` decimal(12,2) NOT NULL DEFAULT '0',
	`deliveryCommission` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('pending','completed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissionLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`deliveryId` int NOT NULL,
	`status` enum('assigned','picked','in_transit','delivered') NOT NULL DEFAULT 'assigned',
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`estimatedDeliveryTime` timestamp,
	`actualDeliveryTime` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryTracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveryTracking_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `inventoryLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantityChange` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`costPrice` decimal(10,2) NOT NULL,
	`baseSalePrice` decimal(10,2) NOT NULL,
	`commissionPercent` decimal(5,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL,
	`finalPrice` decimal(10,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(50) NOT NULL,
	`buyerId` int NOT NULL,
	`referrerId` int,
	`deliveryId` int,
	`totalAmount` decimal(12,2) NOT NULL,
	`commissionAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`finalAmount` decimal(12,2) NOT NULL,
	`status` enum('pending','paid','processing','assigned','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`stripePaymentIntentId` varchar(255),
	`shippingAddress` text NOT NULL,
	`shippingCity` varchar(100) NOT NULL,
	`shippingState` varchar(100),
	`shippingZipCode` varchar(20),
	`shippingCountry` varchar(100) NOT NULL,
	`buyerPhone` varchar(20) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deliveredAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `platformSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int NOT NULL,
	`costPrice` decimal(10,2) NOT NULL,
	`baseSalePrice` decimal(10,2) NOT NULL,
	`commissionPercent` decimal(5,2) NOT NULL DEFAULT '10',
	`finalPrice` decimal(10,2) NOT NULL,
	`stockQuantity` int NOT NULL DEFAULT 0,
	`soldQuantity` int NOT NULL DEFAULT 0,
	`images` text NOT NULL,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotionalBanners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`image` text NOT NULL,
	`link` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promotionalBanners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referralLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`readerId` int NOT NULL,
	`referralCode` varchar(50) NOT NULL,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalConversions` int NOT NULL DEFAULT 0,
	`totalEarnings` decimal(12,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referralLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `referralLinks_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`buyerId` int NOT NULL,
	`orderId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255),
	`comment` text,
	`images` text NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`phone` varchar(20),
	`loginMethod` varchar(64),
	`role` enum('admin','manager','delivery','reader','buyer','developer') NOT NULL DEFAULT 'buyer',
	`profileImage` text,
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`zipCode` varchar(20),
	`country` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(12,2) NOT NULL DEFAULT '0',
	`totalEarned` decimal(12,2) NOT NULL DEFAULT '0',
	`totalWithdrawn` decimal(12,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `userIdx` ON `cartItems` (`userId`);--> statement-breakpoint
CREATE INDEX `orderIdx` ON `commissionLedger` (`orderId`);--> statement-breakpoint
CREATE INDEX `orderIdx` ON `deliveryTracking` (`orderId`);--> statement-breakpoint
CREATE INDEX `deliveryIdx` ON `deliveryTracking` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `productIdx` ON `inventoryLogs` (`productId`);--> statement-breakpoint
CREATE INDEX `orderIdx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `buyerIdx` ON `orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `deliveryIdx` ON `orders` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `products` (`categoryId`);--> statement-breakpoint
CREATE INDEX `createdByIdx` ON `products` (`createdBy`);--> statement-breakpoint
CREATE INDEX `activeIdx` ON `promotionalBanners` (`isActive`);--> statement-breakpoint
CREATE INDEX `readerIdx` ON `referralLinks` (`readerId`);--> statement-breakpoint
CREATE INDEX `productIdx` ON `reviews` (`productId`);--> statement-breakpoint
CREATE INDEX `buyerIdx` ON `reviews` (`buyerId`);