import type { $Enums } from "../../generated/prisma/index.js";
import { mockPrisma } from "./mocks.js";

export function mockPrismaFindFirstUser(id: string) {
	mockPrisma.user.findFirst.mockResolvedValue({
		id,
		createdAt: new Date(),
		updatedAt: new Date(),
		credits: 0,
		frozenCredits: 0,
		email: "",
		password: "",
		username: "",
	});
}

export function mockPrismaFindFirstEmail(
	id: string,
	userId: string,
	status: $Enums.EmailStatus,
) {
	mockPrisma.email.findFirst.mockResolvedValue({
		id,
		subject: "",
		audience: [""],
		html: "",
		userId,
		createdAt: new Date(),
		updatedAt: new Date(),
		status,
	});
}

export function mockPrismaFindManyEmail(userId: string) {
	mockPrisma.email.count.mockResolvedValue(2);
	mockPrisma.email.findMany.mockResolvedValue([
		{
			id: crypto.randomUUID(),
			subject: "test 1",
			audience: [""],
			html: "",
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
			status: "DRAFT",
		},
		{
			id: crypto.randomUUID(),
			subject: "test 2",
			audience: [""],
			html: "",
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
			status: "SCHEDULED",
		},
	]);
}

export function mockPrismaCreateEmail(
	id: string,
	userId: string,
	subject: string,
	audience: string[],
	html: string,
	status: $Enums.EmailStatus,
) {
	mockPrisma.email.create.mockResolvedValue({
		id,
		subject,
		audience,
		html,
		userId,
		createdAt: new Date(),
		updatedAt: new Date(),
		status,
	});
}

export function mockPrismaUpdateEmail(
	id: string,
	userId: string,
	subject: string,
	audience: string[],
	html: string,
	status: $Enums.EmailStatus,
) {
	mockPrisma.email.update.mockResolvedValue({
		id,
		subject,
		audience,
		html,
		userId,
		createdAt: new Date(),
		updatedAt: new Date(),
		status,
	});
}
