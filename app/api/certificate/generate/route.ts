import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as fs from 'fs'
import * as path from 'path'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { userName, courseTitle } = await request.json()

    if (!userName || !userName.trim()) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      )
    }

    // Read template PDF from root directory
    const templatePath = path.join(process.cwd(), 'TeskUp Certificate.pdf')
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: 'Certificate template not found' },
        { status: 404 }
      )
    }

    const templateBytes = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(templateBytes)

    // Get the first page
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Embed fonts - using bold font for beautiful, large text
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Calculate position for name - place it in the gradient shape area (center of page)
    // Based on TeskUp Certificate design, the name should be in the middle gradient area
    const nameY = height * 0.48 // Slightly above center for better visual balance
    const nameX = width / 2 // Center horizontally

    // Draw the user's name with large, beautiful, bold font
    // Use larger font size for impressive appearance
    const fontSize = 42 // Large, beautiful font size - increased for better visibility
    const textWidth = boldFont.widthOfTextAtSize(userName, fontSize)
    
    firstPage.drawText(userName, {
      x: nameX - textWidth / 2, // Center the text
      y: nameY,
      size: fontSize,
      font: boldFont, // Use bold font for beautiful, prominent appearance
      color: rgb(0, 0, 0), // Black color for contrast against gradient
    })

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save()

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${userName.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating certificate:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}

