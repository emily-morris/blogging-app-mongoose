"use strict";

const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const mongoose = require("mongoose");

// make expect syntax available
const expect = chai.expect;

const { Post } = require("../models");
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require("../config");

chai.use(chaiHttp);

// put random docs in db so we have data to work with
// use Faker library to automatically generate placeholder values
// then insert that data into mongo
function seedPostData() {
	console.info("seeding post data");
	const seedData = [];

	for (let i = 1; i <= 11; i++) {
		seedData.push(generatePostData());
	}
	// return promise
	return Post.insertMany(seedData);
}

// generate data to put in db
function generatePostTitle() {
	const titles = ["10 things -- you won't believe #4", "11 things -- you won't believe #4", "12 things -- you won't believe #4", "13 things -- you won't believe #4"];
	return titles[Math.floor(Math.random() * titles.length)];
}

// generate data to put in db
function generatePostContent() {
	const content = ["Some stuff", "Some more stuff", "Even more stuff"];
	return content[Math.floor(Math.random() * content.length)];
}

// generate data to put in db
function generatePostAuthor() {
	const author = { firstName: "John", lastName: "Smith" };
	return author;
}

// generate object representing a post
function generatePostData() {
	return {
		title: generatePostTitle(),
		content: generatePostContent(),
		author: generatePostAuthor()
	};
}

// delete entire db so data clears from test to test
function tearDownDb() {
	console.warn("Deleting database");
	return mongoose.connection.dropDatabase();
}

describe("Posts API resource", function() {
	// each hook function returns promise

	// before starts server
	// runServer connects to db and listens for connections
	before(function() {
		// use separate db URL for tests
		return runServer(TEST_DATABASE_URL);
	});

	// seeds db with test data before each test runs
	beforeEach(function() {
		return seedPostData();
	});

	// zeroes out db after each test runs
	afterEach(function() {
		return tearDownDb();
	});

	// closes server after all tests run
	after(function() {
		return closeServer();
	});

	// `describe` blocks allow us to make clearer tests
	// that focus on proving something small
	describe("GET endpoint", function() {

		it("should return all existing posts", function() {
			// get back all posts returned by GET requests to `posts`
			// prove response has right status and data type
			// prove number of posts we got back is equal to number in db
			// declare `res` here to have access and mutate it across `.then()` calls
			let res;
			return chai.request(app)
				.get("/posts")
				.then(function(_res) {
					res = _res;
					expect(res).to.have.status(200);
					// otherwise db seeding didn't work
					expect(res.body.posts).to.have.lengthOf.at.least(1);
					return Post.count();
				})
				.then(function(count) {
					expect(res.body.posts).to.have.lengthOf(count);
				});
		});

		it("should return posts with right fields", function() {
			// get back all posts and ensure they have expected keys

			let resPost;
			return chai.request(app)
			.get("/posts")
			.then(function(res) {
				expect(res).to.have.status(200);
				expect(res).to.be.json;
				expect(res.body.posts).to.be.a("array");
				expect(res.body.posts).to.have.lengthOf.at.least(1);

				res.body.posts.forEach(function(post) {
					expect(post).to.be.a("object");
					expect(post).to.include.keys("title", "content", "author");
				});
				resPost = res.body.posts[0];
				return resPost;
			})
			.then(function(post) {
				expect(resPost.title).to.equal(post.title);
				expect(resPost.content).to.equal(post.content);
				expect(resPost.author).to.equal(post.author);
			});
		});
	});
})