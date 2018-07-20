"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

//schema to represent posts
const postSchema = mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	author: { 
		firstName: { type:  String, required: true },
		lastName: { type:  String, required: true }
	},
	created: { type: Date, default: Date.now }
});

postSchema.pre("findOne", function(next) {
	this.populate("author");
	next();
});

postSchema.virtual("authorName").get(function() {
	return `${this.author.firstName} ${this.author.lastName}`.trim
	();
});

//returns an obj that only exposes some of the fields
postSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.authorName,
		created: this.created
	};
};

const Post = mongoose.model("Post", postSchema);

Post
	.findOne({
		title: "20 things -- you won't believe #4"
	})
	.then(post => {
		console.log(post.serialize());
	});

module.exports = { Post };