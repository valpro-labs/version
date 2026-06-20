const fs = require( 'node:fs' );
const path = require( 'node:path' );
const childProcess = require( 'node:child_process' );

const SHOOTERGAME_LOG_PATH = path.join( process.env[ 'LOCALAPPDATA' ], 'VALORANT', 'Saved', 'Logs', 'ShooterGame.log' );
const OUTPUT_PATH = path.join( __dirname, 'version.json' );

const REGEXES = {
	branch: /LogShooter: Display: Branch: (?<value>.+)/,
	buildVersion: /LogShooter: Display: Build version: (?<value>.+)/,
	riotClientVersion: /LogShooter: Display: CI server version: (?<value>.+)/,
};

const log = fs.readFileSync( SHOOTERGAME_LOG_PATH, 'utf8' );

const result = {};

for ( const [ key, regex ] of Object.entries( REGEXES ) ) {

	const match = regex.exec( log );
	if ( match ) {

		result[ key ] = match.groups.value.trim();

	}

}

fs.writeFileSync( OUTPUT_PATH, JSON.stringify( result, null, '\t' ) + '\n', 'utf8' );

console.log( 'Written to', OUTPUT_PATH );
console.log( result );

if ( result.branch && result.buildVersion ) {

	const commitMessage = `Update VALORANT version to ${ result.branch } build ${ result.buildVersion }`;

	childProcess.execFileSync( 'git', [ 'add', 'version.json' ], { cwd: __dirname, stdio: 'inherit' } );

	try {

		childProcess.execFileSync( 'git', [ 'diff', '--cached', '--quiet', '--', 'version.json' ], { cwd: __dirname } );
		console.log( 'No version changes to commit.' );

	} catch ( error ) {

		if ( error.status !== 1 ) {

			throw error;

		}

		childProcess.execFileSync( 'git', [ 'commit', '-m', commitMessage ], { cwd: __dirname, stdio: 'inherit' } );
		console.log( 'Committed with message:', commitMessage );

	}

} else {

	console.log( 'Skipped commit because branch or build version was not found.' );

}
