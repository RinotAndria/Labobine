const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'client')));

// Schéma de l'utilisateur
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
});

// Schéma des films enregistrés
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Schéma des avis
const reviewSchema = new mongoose.Schema({
  movieTitle: { type: String, required: true },
  rating: { type: String, required: true },
  recommend: { type: String, required: true },
  favoriteAspect: { type: [String], required: true },
  pace: { type: String, required: true },
  emotion: { type: String, required: true },
  comment: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);
const Review = mongoose.model('Review', reviewSchema);

// Clé TMDb
const tmdbApiKey = process.env.TMDB_API_KEY || 'f99e6476ff8cda926948197c1e958cdf';

// Routes pour servir les pages HTML
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'client/index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Erreur lors de l\'envoi de index.html:', err);
      res.status(500).send('Erreur serveur');
    }
  });
});

app.get('/dashboard', (req, res) => {
  const filePath = path.join(__dirname, 'client/dashboard.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Erreur lors de l\'envoi de dashboard.html:', err);
      res.status(500).send('Erreur serveur');
    }
  });
});

// Route pour obtenir un film aléatoire
app.get('/api/random-movie', async (req, res) => {
  try {
    const currentDate = '2025-06-11'; // Date fixe pour correspondre au frontend
    const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&language=fr-FR&primary_release_date.lte=${currentDate}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.results.length === 0) {
      return res.status(404).json({ message: 'Aucun film trouvé' });
    }
    const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
    res.json({ title: randomMovie.title });
  } catch (error) {
    console.error('Erreur TMDb:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route d’inscription
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Inscription réussie' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route de connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    res.json({
      username: user.username,
      userId: user._id.toString(),
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour sauvegarder un film
app.post('/api/save-movie', async (req, res) => {
  try {
    const { userId, title } = req.body;
    const existingMovie = await Movie.findOne({ userId, title });
    if (existingMovie) {
      return res.status(400).json({ message: 'Ce film est déjà enregistré' });
    }
    const movie = new Movie({ userId, title });
    await movie.save();
    await User.findByIdAndUpdate(userId, { $push: { savedMovies: movie._id } });
    res.json({ message: 'Film enregistré avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du film:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un film
app.delete('/api/delete-movie/:movieId', async (req, res) => {
  try {
    const movieId = req.params.movieId;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Film non trouvé' });
    }
    await Movie.deleteOne({ _id: movieId });
    await User.findByIdAndUpdate(movie.userId, { $pull: { savedMovies: movieId } });
    res.json({ message: 'Film supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du film:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les films enregistrés
app.get('/api/saved-movies/:userId', async (req, res) => {
  try {
    const movies = await Movie.find({ userId: req.params.userId });
    res.json(movies);
  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour sauvegarder un avis
app.post('/api/save-review', async (req, res) => {
  try {
    const { userId, movieTitle, rating, recommend, favoriteAspect, pace, emotion, comment } = req.body;
    const review = new Review({ userId, movieTitle, rating, recommend, favoriteAspect, pace, emotion, comment });
    await review.save();
    await User.findByIdAndUpdate(userId, { $push: { reviews: review._id } });
    res.json({ message: 'Avis enregistré avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'avis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer un avis
app.delete('/api/delete-review/:reviewId', async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }
    await Review.deleteOne({ _id: reviewId });
    await User.findByIdAndUpdate(review.userId, { $pull: { reviews: reviewId } });
    res.json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour obtenir les avis
app.get('/api/reviews/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId });
    res.json(reviews);
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB:', err));

// Démarrer le serveur
app.listen(3000, () => console.log('Serveur démarré sur le port 3000'));