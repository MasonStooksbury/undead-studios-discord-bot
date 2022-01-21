require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });


const TOKEN = process.env.TOKEN;
const prefix = process.env.PREFIX;
const server_id = process.env.SERVER_ID;
const whitelist_channel_id = process.env.WHITELIST_CHANNEL_ID;
const admin_channel_id = process.env.ADMIN_CHANNEL_ID;
const whitelist_rn = process.env.WHITELIST_RN;
const admin_rn = process.env.ADMIN_RN;

// Dependencies
const wallet_validator = require('wallet-address-validator');
const fs = require('fs');

// Files
const wallet_whitelist_txt = './wallet-whitelist.txt';


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
		// Check if this person is already in the list or not. If they aren't, add their address to the whitelist if it isn't already there
		fs.readFile(wallet_whitelist_txt, {encoding:'utf8', flag:'r'}, function(err, data) {
			if (err) throw err;

			// If this user already has a whitelisted address, tell them that
			if (data.includes(msg.author.id)) {
				return msg.reply('You have already whitelisted an address. Please remove your entry if you want to add a different address');
			}

			// Split up the message
			const pieces = msg.content.split(' ');

			// If there is an error with how the user formatted their command
			if (pieces.length !== 3) {
				msg.reply('Please make sure the wallet address and wallet type are in the command\ne.g. ~whitelist-wallet 6969696969420 ETH');
				return;
			}

			const address = pieces[1];
			const type = pieces[2];


			// Validate the address and whitelist it or let the user know what went wrong
			// Details on types of wallets supported: https://www.npmjs.com/package/wallet-address-validator
			let is_valid = false;
			try {
				is_valid = wallet_validator.validate(address, type);
				if (is_valid) {
					msg.reply('The address was valid and your wallet has been whitelisted!');
					
					// Add the entry in this format: 8237438---LambBrainz#3200---98723948723987497898347
					const whitelist_entry = `${msg.author.id}---${msg.author.username}#${msg.author.discriminator}---${address}\n`;
		
					// Write the entry to the whitelist file
					var stream = fs.createWriteStream(wallet_whitelist_txt, { flags: 'a' });
					stream.write(whitelist_entry);
					return;
				} else {
					msg.reply('This is not a valid address')
				}
			} catch {
				msg.reply('Something is wrong with either the address or the currency type. Please try again');
				return;
			}
		});
	}

	// unwhitelist-wallet
	// Whitelisted users can run this command
	// ~unwhitelist-wallet @LambBrainz (this removes the mentioned user)
	// ~unwhitelist-wallet (this removes the person making the command)
	if (msg.content.startsWith(prefix + 'unwhitelist-wallet') && msg.member.roles.cache.some(role => role.name === admin_rn)) {
		let person_to_remove = '';
		
		// If there is no user mentioned, assume the person making the command is the one to remove
		try {
			person_to_remove = msg.mentions.members.first().id;
		} catch {
			person_to_remove = msg.author.id;
		}
		
		fs.readFile(wallet_whitelist_txt, {encoding:'utf8', flag:'r'}, function(err, data) {
			if (err) throw err;
			// Split up the data so that each line is an element in this array
			let lines = data.split(/\r?\n/);

			// Create stream object so that we can write to the file
			var stream = fs.createWriteStream(wallet_whitelist_txt, { flags: 'w' });
			
			// For every line in the file, only write back the ones that AREN'T the user that submitted the command
			lines.forEach(line => {
				if (!line.includes(msg.author.id)) {
					stream.write(`${line}\n`);
				}
			});
		});
	}

	// show-whitelist
	// Only Admins can run this command
	if (msg.content.startsWith(prefix + 'show-whitelist') && msg.member.roles.cache.some(role => role.name === admin_rn)) {
		// Delete command
		msg.delete();

		fs.readFile(wallet_whitelist_txt, {encoding:'utf8', flag:'r'}, function(err, data) {
			if (err) throw err;

			// Find the channel we want to cross-post to and store its channel object
			const channel = msg.guild.channels.cache.find(channel => channel.id === admin_channel_id);
			// Then send our re-formatted string and our images (if any) to that channel
			channel.send(data);
		});

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