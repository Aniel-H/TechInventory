-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 25, 2025 at 06:40 AM
-- Server version: 10.3.39-MariaDB-0ubuntu0.20.04.2
-- PHP Version: 8.3.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `aniel_DB`
--

-- --------------------------------------------------------

--
-- Table structure for table `kategorija`
--

CREATE TABLE `kategorija` (
  `id` int(11) NOT NULL,
  `naziv` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `korisnici`
--

CREATE TABLE `korisnici` (
  `id` int(11) NOT NULL,
  `email` varchar(60) DEFAULT NULL,
  `password` varchar(512) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lokacije`
--

CREATE TABLE `lokacije` (
  `id` int(11) NOT NULL,
  `naziv` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oprema`
--

CREATE TABLE `oprema` (
  `id` int(11) NOT NULL,
  `naziv` varchar(100) NOT NULL,
  `slika` varchar(255) DEFAULT NULL,
  `cijena` decimal(7,2) NOT NULL,
  `proizvodjac_id` int(11) DEFAULT NULL,
  `kategorija_id` int(11) DEFAULT NULL,
  `datum_objave` datetime DEFAULT current_timestamp(),
  `lokacije_id` int(11) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 0,
  `stanje` enum('NOVO','KORISTENO') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proizvodjac`
--

CREATE TABLE `proizvodjac` (
  `id` int(11) NOT NULL,
  `naziv` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `kategorija`
--
ALTER TABLE `kategorija`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `korisnici`
--
ALTER TABLE `korisnici`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- Indexes for table `lokacije`
--
ALTER TABLE `lokacije`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oprema`
--
ALTER TABLE `oprema`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_naziv` (`naziv`),
  ADD KEY `idx_cijena` (`cijena`),
  ADD KEY `idx_proizvodjac_id` (`proizvodjac_id`),
  ADD KEY `idx_kategorija_id` (`kategorija_id`),
  ADD KEY `idx_lokacije_id` (`lokacije_id`);

--
-- Indexes for table `proizvodjac`
--
ALTER TABLE `proizvodjac`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kategorija`
--
ALTER TABLE `kategorija`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `korisnici`
--
ALTER TABLE `korisnici`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lokacije`
--
ALTER TABLE `lokacije`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `oprema`
--
ALTER TABLE `oprema`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proizvodjac`
--
ALTER TABLE `proizvodjac`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `oprema`
--
ALTER TABLE `oprema`
  ADD CONSTRAINT `fk_kategorija` FOREIGN KEY (`kategorija_id`) REFERENCES `kategorija` (`id`),
  ADD CONSTRAINT `fk_oprema_kategorija` FOREIGN KEY (`kategorija_id`) REFERENCES `kategorija` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oprema_proizvodjac` FOREIGN KEY (`proizvodjac_id`) REFERENCES `proizvodjac` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
