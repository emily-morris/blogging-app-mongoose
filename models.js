"use strict";

const mongoose = require("mongoose");

//schema to represent posts
const postSchema = mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, required: true },
	author: { 
		firstName: { type:  String, required: true },
		lastName: { type:  String, required: true }
	}
	// created: { type: Number, required: true }
});


// postSchema.pre("find", function(next) {
// 	this.populate("author", "created");
// 	next();
// });

postSchema.virtual("authorName").get(function() {
	return `${this.author.firstName} ${this.author.lastName}`;
});

//returns an obj that only exposes some of the fields
postSchema.methods.serialize = function() {
	return {
		id: this._id,
		title: this.title,
		content: this.content,
		author: this.authorName
		// created: this.created
	};
};

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };