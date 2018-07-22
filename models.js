"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// schema to represent posts
const postSchema = mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	author: { type: mongoose.Schema.Types.ObjectId, ref: "Author" }
});

// schema to represent authors
const authorSchema = mongoose.Schema({
	firstName: "string",
	lastName: "string",
	userName: {
		type: "string",
		unique: true
	}
});

postSchema.pre("findOne", function(next) {
	this.populate("author");
	next();
});

postSchema.pre("find", function(next) {
	this.populate("author");
	next();
});

postSchema.virtual("authorName").get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim();
});

authorSchema.virtual("author").get(function() {
	return `${this.firstName} ${this.lastName}`.trim();
});

// returns an obj that only exposes some of the fields
postSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.authorName
	};
};

authorSchema.methods.serialize = function() {
	return {
		id: this._id,
		name: this.author,
		userName: this.userName
	}
};

const Author = mongoose.model("Author", authorSchema);
const Post = mongoose.model("Blogpost", postSchema);

module.exports = { Author, Post };