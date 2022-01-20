require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const TOKEN = process.env.TOKEN;


const prefix = '~';
const server_id = '690731272875802684';
const whitelist_channel_id = '933601900861997076';

const wallet_validator = require('wallet-address-validator');

// Role names
const whitelist_rn = 'whitelist';
const admin_rn = 'Admin'



// Invite link: https://discord.com/api/oauth2/authorize?client_id=933600223127801856&permissions=268512256&scope=bot


client.login(TOKEN);

// When the bot connects
client.on('ready', () => {
	console.info(`Logged in as ${client.user.tag}!`);
});





// When the bot detects that the message has been sent
client.on('messageCreate', msg => {

	const guild = client.guilds.cache.get(server_id);

	// If this isn't a command, or the user is a bot, or this is a DM: leave
	if (!msg.content.startsWith(prefix) || msg.author.bot || msg.channel.type == 'dm') return;

	// whitelist-wallet command
	// Whitelisted users can run this command
	// If the message is in the whitelist channel and they user has the "whitelist" role
	if (msg.content.startsWith(prefix + 'whitelist-wallet') && msg.channel.id === whitelist_channel_id && msg.member.roles.cache.some(role => role.name === whitelist_rn)) {
		// Split up the message
		const pieces = msg.content.split(' ');
		console.log(pieces.length);
		if (pieces.length !== 3) {
			msg.reply('Please make sure the wallet address and wallet type are in the command\ne.g. ~whitelist-wallet 6969696969420 ETH');
			return;
		}
		const type = pieces[1];
		const address = pieces[2];


		// Validate the address and whitelist it or let the user know what went wrong
		// Details on types of wallets supported: https://www.npmjs.com/package/wallet-address-validator
		let is_valid = false;
		try {
			is_valid = wallet_validator.validate(address, type);
			msg.reply('The address was valid and your wallet has been whitelisted!');
		} catch {
			msg.reply('Something is wrong with either the address or the currency type. Please try again');
			return;
		}
	}

	// whitelist-user
	// Only Admins can do this
	else if (msg.content.startsWith(prefix + 'whitelist-user') && msg.member.roles.cache.some(role => role.name === admin_rn)) {
		// Grab whoever is mentioned in the command
		const person = msg.mentions.members.first();

		// If they are already whitelisted, let the user know
		if (person.roles.cache.some(role => role.name === whitelist_rn)) {
			msg.channel.send(`<@${person.user.id}> is already whitelisted.`);
		}
		// Else, whitelist them
		else {
			// Grab the actual role object
			var role = guild.roles.cache.find(role => role.name === whitelist_rn);
			// Assign the role object to our person
			person.roles.add(role);
			msg.channel.send(`<@${person.user.id}> has been successfully whitelisted!`);
		}
	}

	// unwhitelist-user
	// Only Admins can do this
	else if (msg.content.startsWith(prefix + 'unwhitelist-user') && msg.member.roles.cache.some(role => role.name === admin_rn)) {
		// Grab whoever is mentioned in the command
		let person = msg.mentions.members.first();

		// If they are already unmuted, let the muter know
		if (!person.roles.cache.some(role => role.name === whitelist_rn)) {
			msg.channel.send(`<@${person.user.id}> is not whitelisted.`);
		}
		// Else, unwhitelist them
		else {
			// Grab the actual role object
			var role = guild.roles.cache.find(role => role.name === whitelist_rn);
			// Assign the role object to our person
			person.roles.remove(role);
			msg.channel.send(`<@${person.user.id}> has been successfully removed from the whitelist!`);
		}
	}
});