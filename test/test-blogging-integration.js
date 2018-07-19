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
	const title = faker.lorem.sentence();
	return title;
}

// generate data to put in db
function generatePostContent() {
	const content = faker.lorem.text();
	return content;
}

// generate data to put in db
function generatePostAuthor() {
	const author = { firstName: faker.name.firstName(), lastName: faker.name.lastName() };
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

	describe("POST endpoint", function() {
		// make a POST req with data
		// prove that post we get back has right keys
		// and that `id` is there (means data was inserted
		// into db
		it("should add a new post", function() {

			const newPost = generatePostData();
			console.info(newPost);
			return chai.request(app)
			.post("/posts")
			.send(newPost)
			.then(function(res) {
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a("object");
				expect(res.body).to.include.keys("title", "content", "author" );
				expect(res.body.title).to.equal(newPost.title);
				// Mongo should have created id on insertion
				expect(res.body.id).to.not.be.null;
				expect(res.body.content).to.equal(newPost.content);
				expect(res.body.author).to.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
				return Post.findById(res.body.id);
			})
			.then(function(post) {
				expect(post.title).to.equal(newPost.title);
				expect(post.content).to.equal(newPost.content);
				expect(post.author.firstName).to.equal(newPost.author.firstName);
				expect(post.author.lastName).to.equal(newPost.author.lastName);
			});
		});
	});

	describe("PUT endpoint", function() {
		// get existing post from db
		// make a PUT req to update post
		// prove post returned by req contains data we sent
		// prove post in db is correctly updated
		it("should update fields you send over", function() {
			const updateData = {
				title: "great title",
				content: "great words",
				author: "Great Author"
			};

			return Post
				.findOne()
				.then(function(post) {
					updateData.id = post.id;

					// make req then inspect it to make sure it reflects data we sent
					return chai.request(app)
						.put(`/posts/${post.id}`)
						.send(updateData);
				})
				.then(function(res) {
					expect(res).to.have.status(204);

					return Post.findById(updateData.id);
				})
				.then(function(post) {
					expect(post.title).to.equal(updateData.title);
					expect(post.content).to.equal(updateData.content);
					expect(post.author.firstName).to.equal(updateData.author.firstName);
					expect(post.author.lastName).to.equal(updateData.author.lastName);
				});
		});
	});

	
})