-- ============================================================
-- 3movieCollectors - Sample Data
-- ============================================================
USE 3movieCollectors;

-- ============================================================
-- GENRES (Common movie genres)
-- ============================================================
INSERT INTO Genres (genreName)
VALUES 
('Action'), 
('Comedy'), 
('Drama'),
('Thriller'),
('Romance'),
('Sci-Fi'),
('Horror'),
('Animation'),
('Adventure'),
('Crime');

-- ============================================================
-- RESTRICTED WORDS (Content moderation)
-- ============================================================
INSERT INTO RestrictedWords (word)
VALUES
('badword1'),
('badword2'),
('spoiler'),
('hate'),
('offensive'),
('spam'),
('troll');

-- ============================================================
-- Success Message
-- ============================================================
SELECT 'Sample data inserted successfully!' AS Status;
SELECT 'Ready for user registration and TMDB movie import!' AS NextSteps;
