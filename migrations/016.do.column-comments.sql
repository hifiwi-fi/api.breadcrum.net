comment on table archives is 'Bookmark archives';
comment on table auth_tokens is 'User authentication tokens';
comment on table bookmarks is 'Bookmark data';
comment on table bookmarks_tags is 'Bookmarks Tags join table';
comment on table email_blackhole is 'Email abuse table';
comment on table episodes is 'Episodes table';
comment on table feature_flags is 'Feature flags';
comment on table sns is 'SNS logging';
comment on table sns is 'Bookmark Tags';
comment on table sns is 'User data';

comment on column archives.id is 'Archive ID';
comment on column archives.owner_id is 'User ID of Archive owner';
comment on column archives.bookmark_id is 'Associated Bookmark ID';
comment on column archives.created_at is 'Created date time';
comment on column archives.updated_at is 'Modified date time';
comment on column archives.url is 'The URL the archive is associated with';
comment on column archives.title is 'Archive Title';
comment on column archives.site_name is 'Name of the website for the archive';
comment on column archives.html_content is 'The sanitized and simplified reader HTML of the archive';
comment on column archives.text_content is 'The textual representation of the reader html';
comment on column archives.length is 'String length of article';
comment on column archives.excerpt is 'Reader extracted excerpt string';
comment on column archives.byline is 'Author metadata';
comment on column archives.direction is 'ltr or rtl';
comment on column archives.language is 'Content language';
comment on column archives.extraction_method is 'Extraction method server or client';
comment on column archives.error is 'Associated extraction error data';
comment on column archives.done is 'True when extraction work is done';
comment on column archives.ready is 'Done and no error';

comment on column auth_tokens.jti is 'The id of the JWT auth token';
comment on column auth_tokens.owner_id is 'User UD of Archive owner';
comment on column auth_tokens.created_at is 'Created date time';
comment on column auth_tokens.last_seen is 'The date time the last time the auth token was seen';
comment on column auth_tokens.user_agent is 'The last user agent used with the auth token';
comment on column auth_tokens.ip is 'The last ip seen with the auth token';

comment on column bookmarks.id is 'Bookmark ID';
comment on column bookmarks.url is 'The URL of the bookmark is saving';
comment on column bookmarks.title is 'The primary title of the bookmark';
comment on column bookmarks.note is 'The freeform user note associated with the bookmark';
comment on column bookmarks.created_at is 'Created date time';
comment on column bookmarks.updated_at is 'Modified date time';
comment on column bookmarks.starred is 'Bookmark star status';
comment on column bookmarks.toread is 'Bookmark read status';
comment on column bookmarks.sensitive is 'Bookmark sensitivity';
comment on column bookmarks.owner_id is 'User ID of bookmark owner';
comment on column bookmarks.archive_urls is 'Array of public archive url';
comment on column bookmarks.summary is 'Text representing the summary of the bookmark. Usually bookmarklet generated';
comment on column bookmarks.error is 'Error string associated with failed metadata extraction';
comment on column bookmarks.done is 'Metadata extraction status';

comment on column bookmarks_tags.bookmark_id is 'ID of the bookmark';
comment on column bookmarks_tags.tag_id is 'ID of the tag';

comment on column email_blackhole.id is 'ID of the black-holed email';
comment on column email_blackhole.created_at is 'Created date time';
comment on column email_blackhole.updated_at is 'Modified date time';
comment on column email_blackhole.email is 'The black-holed email address';
comment on column email_blackhole.bounce_count is 'The number of times the email address has bounced';
comment on column email_blackhole.disabled is 'The boolean used to determine if the email is black-holed or not';

comment on column episodes.id is 'ID of episode';
comment on column episodes.owner_id is 'User ID of episode owner';
comment on column episodes.podcast_feed_id is 'Podcast feed ID the episode is listed in';
comment on column episodes.bookmark_id is 'Bookmark ID the episode was created on';
comment on column episodes.created_at is 'Created date time';
comment on column episodes.updated_at is 'Modified date time';
comment on column episodes.url is 'The URL of the episode is generated with';
comment on column episodes.type is 'The type of episode (cloud redirect, b2 hosted file etc)';
comment on column episodes.medium is 'The desired medium of the episode (video or audio)';
comment on column episodes.size_in_bytes is 'Data size of the episode';
comment on column episodes.duration_in_seconds is 'The duration of the episode in seconds';
comment on column episodes.mime_type is 'The mime_type of the episode';
comment on column episodes.author_name is 'Name of the media author';
comment on column episodes.filename is 'Filename of the media';
comment on column episodes.ext is 'The extension of the media';
comment on column episodes.src_type is 'The detected medium of the media found (video or audio)';
comment on column episodes.error is 'Error string encountered during extraction';
comment on column episodes.title is 'The title from the media extraction';
comment on column episodes.thumbnail is 'A URL of the media thumbnail';
comment on column episodes.author_url is 'A URL of associated media author like channel URL';
comment on column episodes.done is 'Episode extraction status';
comment on column episodes.ready is 'Episode ready status (done and !error)';

comment on column feature_flags.id is 'The ID of the feature flag';
comment on column feature_flags.created_at is 'Created date time';
comment on column feature_flags.updated_at is 'Modified date time';
comment on column feature_flags.name is 'Name of the flag';
comment on column feature_flags.value is 'The jsonb value of the flag';

comment on column podcast_feeds.id is 'The ID of the podcast feed';
comment on column podcast_feeds.owner_id is 'The User ID of the podcast feed owner';
comment on column podcast_feeds.created_at is 'Created date time';
comment on column podcast_feeds.updated_at is 'Modified date time';
comment on column podcast_feeds.title is 'The user configurable title of the podcast feed';
comment on column podcast_feeds.description is 'The user configurable description of the podcast feed';
comment on column podcast_feeds.image_url is 'The user configurable image_url of the podcast feed';
comment on column podcast_feeds.explicit is 'The user configurable explicit status of the podcast feed';
comment on column podcast_feeds.token is 'The user rotatable feed token used in basic auth';

comment on column sns.id is 'The ID of the sns log event';
comment on column sns.created_at is 'Created date time';
comment on column sns.updated_at is 'Modified date time';
comment on column sns.body is 'The raw body of the sns event';

comment on column tags.id is 'The ID of the tag';
comment on column tags.name is 'The name of the tag';
comment on column tags.owner_id is 'The User ID of the tag owner';
comment on column tags.created_at is 'Created date time';
comment on column tags.updated_at is 'Modified date time';

comment on column users.id is 'The ID of the User';
comment on column users.username is 'The username of the User';
comment on column users.email is 'The email address of the User';
comment on column users.email_confirmed is 'The email verification status';
comment on column users.password is 'The hashed and salted user password';
comment on column users.created_at is 'Created date time';
comment on column users.updated_at is 'Modified date time';
comment on column users.default_podcast_feed_id is 'The ID of the users default podcast feed';
comment on column users.admin is 'Admin status of the user';
comment on column users.email_verify_token is 'The token emailed to a user to verify their email';
comment on column users.email_verify_token_exp is 'The expiration timestamp of the email verification token';
comment on column users.pending_email_update is 'The email address the user is trying to change to';
comment on column users.pending_email_update_token is 'The token sent to the pending email address for verification';
comment on column users.pending_email_update_token_exp is 'The expiration timestamp of the pending token';
comment on column users.password_reset_token is 'The password reset token mailed to the users primary email address for password resets';
comment on column users.password_reset_token_exp is 'The password reset token expiration timestamp';
comment on column users.newsletter_subscription is 'Marketing email preference status';
