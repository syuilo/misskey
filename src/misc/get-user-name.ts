export default function(user: { name?: string | null, username: string }): string {
	return user.name || user.username;
}
